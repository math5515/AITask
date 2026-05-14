'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, Recommendation } from '@/lib/types';
import InputPanel from '@/components/InputPanel';
import TaskList from '@/components/TaskList';
import RecommendationPanel from '@/components/RecommendationPanel';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => setTasks(data.tasks ?? []));
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        const data = await res.json();
        const recs: Recommendation[] = data.recommendations ?? [];
        setRecommendations(recs);
        setHighlightedTaskIds(recs.map(r => r.taskId));
      }
    } finally {
      setRecLoading(false);
    }
  }, []);

  function handleTaskAdded(task: Task) {
    setTasks(prev => [task, ...prev]);
    fetchRecommendations();
  }

  function handleTaskUpdated(updated: Task) {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    fetchRecommendations();
  }

  function handleTaskDeleted(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setHighlightedTaskIds(prev => prev.filter(i => i !== id));
    fetchRecommendations();
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800 bg-zinc-950">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-sm font-bold select-none">
          T
        </div>
        <span className="text-sm font-semibold text-zinc-100">TaskFlow</span>
        <span className="text-xs text-zinc-600 hidden sm:block">Personal task manager</span>
      </header>

      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '360px 1fr 320px' }}>
        <aside className="border-r border-zinc-800 overflow-hidden flex flex-col">
          <InputPanel onTaskAdded={handleTaskAdded} />
        </aside>

        <main className="overflow-hidden flex flex-col">
          <TaskList
            tasks={tasks}
            highlightedTaskIds={highlightedTaskIds}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        </main>

        <aside className="border-l border-zinc-800 overflow-hidden flex flex-col">
          <RecommendationPanel
            recommendations={recommendations}
            loading={recLoading}
            onRefresh={fetchRecommendations}
          />
        </aside>
      </div>
    </div>
  );
}
