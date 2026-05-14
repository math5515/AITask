import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllTasks, insertTask } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const status = request.nextUrl.searchParams.get('status');
  const tasks = await getAllTasks(userId, status);
  return Response.json({ tasks });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { task, raw_input } = body;

  if (!task?.title || !task?.priority || task?.hours == null) {
    return Response.json({ error: 'Invalid task data' }, { status: 400 });
  }

  const created = await insertTask(userId, task, raw_input ?? '');
  return Response.json({ task: created }, { status: 201 });
}
