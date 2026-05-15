'use client';

import { useEffect, useState } from 'react';

export interface GraveTask {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  hours: number;
  killedAt: string;
  causeOfDeath: 'completed' | 'deleted';
}

const EPITAPHS_DONE = [
  'REST in PROD.', 'Shipped. Finally.', 'Done. As promised.',
  'Closed. No follow-up.', 'Merged and forgotten.', 'It is done.',
];

const EPITAPHS_DELETED = [
  'Scope crept.', 'Abandoned at standup.', 'Deleted without remorse.',
  'Never gonna happen.', 'Deprioritized forever.', 'Not in this sprint.',
];

function epitaph(task: GraveTask): string {
  const pool = task.causeOfDeath === 'completed' ? EPITAPHS_DONE : EPITAPHS_DELETED;
  return pool[task.id % pool.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  onClose: () => void;
}

export const GRAVEYARD_KEY = 'taskflow_graveyard';

export function saveToGraveyard(task: { id: number; title: string; priority: 'high' | 'medium' | 'low'; hours: number }, cause: 'completed' | 'deleted') {
  if (typeof window === 'undefined') return;
  const existing: GraveTask[] = JSON.parse(localStorage.getItem(GRAVEYARD_KEY) ?? '[]');
  if (existing.find(g => g.id === task.id)) return; // already buried
  const entry: GraveTask = { ...task, killedAt: new Date().toISOString(), causeOfDeath: cause };
  localStorage.setItem(GRAVEYARD_KEY, JSON.stringify([entry, ...existing].slice(0, 60)));
}

export default function GraveyardModal({ onClose }: Props) {
  const [graves, setGraves] = useState<GraveTask[]>([]);

  useEffect(() => {
    setGraves(JSON.parse(localStorage.getItem(GRAVEYARD_KEY) ?? '[]'));
  }, []);

  function clearGraveyard() {
    localStorage.removeItem(GRAVEYARD_KEY);
    setGraves([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">

        {/* Fog strip */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(9,9,11,0.9), transparent)' }} />

        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-zinc-800 bg-zinc-950">
          <span className="text-lg">🪦</span>
          <span className="text-sm font-semibold text-zinc-200">Task Graveyard</span>
          <span className="text-xs text-zinc-600 ml-1">— here lie the fallen</span>
          <div className="ml-auto flex items-center gap-3">
            {graves.length > 0 && (
              <button onClick={clearGraveyard} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Graveyard scene */}
        <div className="flex-1 overflow-y-auto px-5 py-6"
          style={{ background: 'radial-gradient(ellipse at top, #0d1117 0%, #09090b 100%)' }}>

          {graves.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <span className="text-4xl">🌱</span>
              <p className="text-zinc-500 text-sm">No tasks have perished yet.</p>
              <p className="text-zinc-700 text-xs">Complete or delete a task to see it memorialized here.</p>
            </div>
          ) : (
            <>
              {/* Moon */}
              <div className="flex justify-center mb-6 opacity-40">
                <div className="w-12 h-12 rounded-full bg-yellow-100 relative overflow-hidden shadow-[0_0_24px_6px_rgba(254,249,195,0.15)]">
                  <div className="absolute top-1 right-1 w-9 h-9 rounded-full bg-zinc-950" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {graves.map((grave, i) => (
                  <div
                    key={grave.id}
                    className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                  >
                    {/* Tombstone SVG */}
                    <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-lg">
                      {/* Stone body */}
                      <rect x="10" y="30" width="60" height="55" rx="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Arch top */}
                      <path d="M10 30 Q10 10 40 10 Q70 10 70 30 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* RIP text */}
                      <text x="40" y="52" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="serif" fontStyle="italic">R.I.P</text>
                      {/* Divider */}
                      <line x1="22" y1="56" x2="58" y2="56" stroke="#3f3f46" strokeWidth="1" />
                      {/* Priority dot */}
                      <circle cx="40" cy="24"
                        r="5"
                        fill={grave.priority === 'high' ? '#dc2626' : grave.priority === 'medium' ? '#d97706' : '#16a34a'}
                      />
                      {/* Cause icon */}
                      <text x="40" y="80" textAnchor="middle" fill="#52525b" fontSize="7" fontFamily="monospace">
                        {grave.causeOfDeath === 'completed' ? '✓ done' : '✕ deleted'}
                      </text>
                      {/* Ground */}
                      <rect x="5" y="84" width="70" height="8" rx="2" fill="#18181b" />
                      {/* Grass tufts */}
                      {[14, 22, 30, 48, 60, 68].map(gx => (
                        <line key={gx} x1={gx} y1="84" x2={gx - 2} y2="79" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
                      ))}
                    </svg>

                    {/* Info below */}
                    <div className="text-center max-w-[100px]">
                      <p className="text-zinc-300 text-xs font-medium leading-tight line-clamp-2">{grave.title}</p>
                      <p className="text-zinc-600 text-[10px] mt-1 italic">&ldquo;{epitaph(grave)}&rdquo;</p>
                      <p className="text-zinc-700 text-[10px] mt-0.5">{timeAgo(grave.killedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-zinc-800 text-xs mt-8 pb-8">
                {graves.length} task{graves.length !== 1 ? 's' : ''} lost to the void
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
