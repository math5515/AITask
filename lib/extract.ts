import { anthropic, MODEL, withRetry } from './claude';
import type { ExtractedTask } from './types';

export async function extractTaskFromMessage(message: string): Promise<ExtractedTask> {
  const today = new Date().toISOString().split('T')[0];

  const response = await withRetry(() => anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a task extraction assistant for a senior software developer.
Given a Slack message or email, extract exactly one primary task.
Today's date is ${today}.

Rules:
- "hours" is realistic effort for a SENIOR developer (not junior). Typical range: 0.5–16.
- Priority: "ASAP"/"urgent"/"blocking" → high; normal feature/bug requests → medium; "when you get a chance"/"low priority" → low.
- deadline: output as YYYY-MM-DD if a date is mentioned, otherwise null.
- requester: the person asking (not yourself). null if not mentioned.
- Respond ONLY with valid JSON matching the schema. No markdown fences, no commentary.

Schema: {"title": string, "priority": "high"|"medium"|"low", "hours": number, "deadline": string|null, "requester": string|null}`,
    messages: [{ role: 'user', content: `Extract the task from this message:\n\n${message}` }],
  }));

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected AI response type');

  return JSON.parse(block.text) as ExtractedTask;
}
