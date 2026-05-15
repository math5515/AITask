import { auth } from '@clerk/nextjs/server';
import { getOpenTasks } from '@/lib/db';
import { anthropic, MODEL, withRetry } from '@/lib/claude';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = await getOpenTasks(userId);
  const today = new Date().toISOString().split('T')[0];

  const taskSummary = tasks.length === 0
    ? 'No tasks whatsoever. A truly empty existence.'
    : tasks.map(t =>
        `- ${t.title} (${t.priority} priority, ${t.hours}h${t.deadline ? `, due ${t.deadline}` : ''}${t.status === 'in_progress' ? ', IN PROGRESS' : ''})`
      ).join('\n');

  let horoscope = 'The stars refuse to comment on your task list today. Try again tomorrow.';

  try {
    const response = await withRetry(() => anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: `You are a mystical productivity oracle who speaks in the style of an absurdly dramatic astrology horoscope.
Today is ${today}.
You will receive a developer's task list and generate a short, punchy horoscope paragraph for them.
Be SPECIFIC about their actual tasks — name them. Frame everything in ridiculous zodiac/cosmic language.
Be funny, mildly roast-y, and dramatic. 3–4 sentences max. No markdown. Plain text only.`,
      messages: [{
        role: 'user',
        content: `My open tasks:\n${taskSummary}\n\nGive me my productivity horoscope for today.`,
      }],
    }));

    const block = response.content[0];
    if (block.type === 'text') horoscope = block.text;
  } catch {
    // fallback already set
  }

  return Response.json({ horoscope, date: today });
}
