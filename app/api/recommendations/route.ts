import { getOpenTasks } from '@/lib/db';
import { anthropic, MODEL } from '@/lib/claude';
import type { Recommendation } from '@/lib/types';

export async function GET() {
  const tasks = getOpenTasks();

  if (tasks.length === 0) {
    return Response.json({ recommendations: [] });
  }

  const today = new Date().toISOString().split('T')[0];
  const count = Math.min(tasks.length, 3);

  const taskSummary = tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    hours: t.hours,
    deadline: t.deadline,
    requester: t.requester,
    status: t.status,
  }));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a productivity coach for a senior software developer.
Given their open task list, recommend exactly ${count} tasks to work on RIGHT NOW.
Today is ${today}.

Scoring factors (in priority order):
1. Deadlines that are today or overdue
2. High priority tasks
3. Short tasks (quick wins) that may unblock others
4. Stakeholder importance inferred from context

Respond ONLY with a valid JSON array of exactly ${count} objects. No markdown fences, no extra text.
Schema: [{"taskId": number, "title": string, "reasoning": string, "urgencyScore": number}]
- reasoning: 1–2 sentences, be specific and actionable
- urgencyScore: integer 1–10`,
    messages: [{
      role: 'user',
      content: `My open tasks:\n${JSON.stringify(taskSummary, null, 2)}\n\nWhat should I work on next?`,
    }],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    return Response.json({ recommendations: [] });
  }

  let recommendations: Recommendation[];
  try {
    recommendations = JSON.parse(block.text) as Recommendation[];
  } catch {
    return Response.json({ recommendations: [] });
  }

  return Response.json({ recommendations });
}
