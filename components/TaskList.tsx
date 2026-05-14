'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  highlightedTaskIds: number[];
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (id: number) => void;
}

type StatusFilter = 'all' | Task['status'];

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

export default function TaskList({ tasks, highlightedTaskIds, onTaskUpdated, onTaskDeleted }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  async function handleStatusChange(id: number, status: Task['status']) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      onTaskUpdated(data.task);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) onTaskDeleted(id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-zinc-300">
          Tasks <span className="text-zinc-600 font-normal">({visible.length})</span>
        </h2>
        <div className="flex gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === tab.value
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visible.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm py-16">
            {filter === 'all'
              ? 'No tasks yet. Paste a message to get started.'
              : `No ${filter.replace('_', ' ')} tasks.`}
          </p>
        ) : (
          visible.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              highlighted={highlightedTaskIds.includes(task.id)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
