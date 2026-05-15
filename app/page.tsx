'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Recommendation } from '@/lib/types';
import InputPanel from '@/components/InputPanel';
import TaskList from '@/components/TaskList';
import RecommendationPanel from '@/components/RecommendationPanel';
import StandupModal from '@/components/StandupModal';
import TitanicGame from '@/components/TitanicGame';
import { UserButton } from '@clerk/nextjs';

type MobileTab = 'input' | 'tasks' | 'recs';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<MobileTab>('input');
  const [showStandup, setShowStandup] = useState(false);
  const [showTitanic, setShowTitanic] = useState(false);
  const logoClicksRef = useRef<number[]>([]);

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
    setActiveTab('tasks');
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

  function handleLogoClick() {
    const now = Date.now();
    logoClicksRef.current = [...logoClicksRef.current, now].filter(t => now - t < 2000);
    if (logoClicksRef.current.length >= 5) {
      logoClicksRef.current = [];
      setShowTitanic(true);
    }
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800 bg-zinc-950">
        <div
          onClick={handleLogoClick}
          className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-sm font-bold select-none cursor-pointer"
        >
          T
        </div>
        <span className="text-sm font-semibold text-zinc-100">TaskFlow</span>
        <span className="text-xs text-zinc-600 hidden sm:block">Personal task manager</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowStandup(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-800"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Standup
          </button>
          <UserButton />
        </div>
      </header>

      {/* Desktop: 3-column layout */}
      <div className="hidden md:grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '360px 1fr 320px' }}>
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

      {/* Mobile: single active panel */}
      <div className="md:hidden flex-1 overflow-hidden">
        {activeTab === 'input' && <InputPanel onTaskAdded={handleTaskAdded} />}
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            highlightedTaskIds={highlightedTaskIds}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        )}
        {activeTab === 'recs' && (
          <RecommendationPanel
            recommendations={recommendations}
            loading={recLoading}
            onRefresh={fetchRecommendations}
          />
        )}
      </div>

      {/* Mobile: bottom tab nav */}
      <nav className="md:hidden shrink-0 flex border-t border-zinc-800 bg-zinc-950 safe-area-pb">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            activeTab === 'input' ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            activeTab === 'tasks' ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Tasks{tasks.length > 0 && <span className="text-zinc-500">({tasks.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('recs')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            activeTab === 'recs' ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Next Up
        </button>
      </nav>

      {showStandup && <StandupModal onClose={() => setShowStandup(false)} />}
      {showTitanic && <TitanicGame onClose={() => setShowTitanic(false)} />}
    </div>
  );
}
