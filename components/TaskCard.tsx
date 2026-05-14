'use client';

import type { Task } from '@/lib/types';
import PriorityBadge from './PriorityBadge';

interface Props {
  task: Task;
  highlighted: boolean;
  onStatusChange: (id: number, status: Task['status']) => void;
  onDelete: (id: number) => void;
}

const STATUS_TABS: { value: Task['status']; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

function deadlineLabel(deadline: string | null): { text: string; overdue: boolean } | null {
  if (!deadline) return null;
  const due = new Date(deadline + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { text: 'Due today', overdue: true };
  if (diffDays === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: `Due ${deadline}`, overdue: false };
}

export default function TaskCard({ task, highlighted, onStatusChange, onDelete }: Props) {
  const dl = deadlineLabel(task.deadline);

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      highlighted
        ? 'border-indigo-500 bg-zinc-800'
        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <PriorityBadge priority={task.priority} />
            {task.requester && (
              <span className="text-xs text-zinc-500">from {task.requester}</span>
            )}
          </div>
          <p className={`text-sm font-medium leading-snug ${
            task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'
          }`}>
            {task.title}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {task.hours}h
            </span>
            {dl && (
              <span className={`text-xs flex items-center gap-1 ${dl.overdue ? 'text-red-400' : 'text-zinc-500'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                {dl.text}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-zinc-600 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5 p-1"
          title="Delete task"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-1 mt-3">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(task.id, tab.value)}
            className={`flex-1 text-xs py-1 rounded transition-colors ${
              task.status === tab.value
                ? 'bg-indigo-600 text-white font-medium'
                : 'bg-zinc-700 text-zinc-500 hover:bg-zinc-600 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
