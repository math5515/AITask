import { NextRequest } from 'next/server';
import { getAllTasks, insertTask } from '@/lib/db';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const tasks = getAllTasks(status);
  return Response.json({ tasks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task, raw_input } = body;

  if (!task?.title || !task?.priority || task?.hours == null) {
    return Response.json({ error: 'Invalid task data' }, { status: 400 });
  }

  const created = insertTask(task, raw_input ?? '');
  return Response.json({ task: created }, { status: 201 });
}
