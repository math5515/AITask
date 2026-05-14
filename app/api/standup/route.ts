import { auth } from '@clerk/nextjs/server';
import { getInProgressTasks, getRecentlyDoneTasks } from '@/lib/db';
import { anthropic, MODEL } from '@/lib/claude';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [inProgress, recentlyDone] = await Promise.all([
    getInProgressTasks(userId),
    getRecentlyDoneTasks(userId),
  ]);

  if (inProgress.length === 0 && recentlyDone.length === 0) {
    return Response.json({
      standup: 'Yesterday: No completed tasks logged.\nToday: No tasks in progress.\nBlockers: None.',
    });
  }

  const today = new Date().toISOString().split('T')[0];

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: `You are writing a daily standup update for a software developer.
Today is ${today}.
Write in first person, past/present tense, short sentences.
Format EXACTLY as three lines:
Yesterday: <what was completed>
Today: <what is in progress>
Blockers: <any blockers based on overdue deadlines or high-priority items, otherwise "None">
No preamble, no extra lines.`,
      messages: [{
        role: 'user',
        content: `Recently completed tasks (last 24h):\n${
          recentlyDone.length
            ? recentlyDone.map(t => `- ${t.title}`).join('\n')
            : '- None'
        }\n\nCurrently in progress:\n${
          inProgress.length
            ? inProgress.map(t => `- ${t.title}${t.deadline ? ` (due ${t.deadline})` : ''}`).join('\n')
            : '- None'
        }`,
      }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: 'AI service error', detail: msg }, { status: 502 });
  }

  const block = response.content[0];
  if (block.type !== 'text') {
    return Response.json({ error: 'Unexpected AI response type' }, { status: 500 });
  }

  return Response.json({ standup: block.text.trim() });
}
