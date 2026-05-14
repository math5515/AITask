import { NextRequest } from 'next/server';
import { extractTaskFromMessage } from '@/lib/extract';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message: string = body?.message;

  if (!message?.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const task = await extractTaskFromMessage(message);
    return Response.json({ task });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    if (detail === 'Unexpected AI response type') {
      return Response.json({ error: detail }, { status: 500 });
    }
    // JSON parse failure from extractTaskFromMessage
    if (detail.includes('JSON')) {
      return Response.json({ error: 'AI returned invalid JSON' }, { status: 422 });
    }
    return Response.json({ error: 'AI service error', detail }, { status: 502 });
  }
}
