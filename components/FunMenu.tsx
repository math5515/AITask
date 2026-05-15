'use client';

import { useEffect, useRef, useState } from 'react';

export type FunFeature = 'graveyard' | 'horoscope' | 'wheel' | 'boss' | 'shame';

interface Props {
  onSelect: (feature: FunFeature) => void;
}

const ITEMS: { id: FunFeature; emoji: string; label: string; desc: string }[] = [
  { id: 'graveyard', emoji: '🪦', label: 'Task Graveyard',        desc: 'Visit your fallen tasks' },
  { id: 'horoscope', emoji: '🔮', label: 'Productivity Horoscope', desc: 'Let the stars guide you' },
  { id: 'wheel',     emoji: '🎡', label: 'Spin the Wheel',         desc: 'Fate picks your next task' },
  { id: 'boss',      emoji: '👹', label: 'Boss Battle',            desc: 'Defeat your tasks in combat' },
  { id: 'shame',     emoji: '🔔', label: 'The Shame Bell',         desc: 'Name and shame your oldest task' },
];

export default function FunMenu({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function select(id: FunFeature) {
    setOpen(false);
    onSelect(id);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg ${
          open ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Fun features"
      >
        <span className="text-sm leading-none">🎲</span>
        <span className="hidden sm:inline">Extras</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
          {ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => select(item.id)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
            >
              <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-zinc-200 text-xs font-medium">{item.label}</p>
                <p className="text-zinc-600 text-xs">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
