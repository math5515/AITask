import { NextRequest } from 'next/server';
import { updateTask, deleteTask } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    return Response.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  const fields = await request.json();
  const updated = updateTask(taskId, fields);

  if (!updated) {
    return Response.json({ error: 'Task not found or no fields provided' }, { status: 404 });
  }

  return Response.json({ task: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    return Response.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  const deleted = deleteTask(taskId);

  if (!deleted) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
