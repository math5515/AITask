'use client';

import { useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  onClose: () => void;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function shameMessage(task: Task, days: number): string {
  if (days > 30) return `${days} DAYS. This task has been alive longer than most houseplants you've killed.`;
  if (days > 14) return `${days} days and counting. It's been here longer than your gym streak.`;
  if (days > 7) return `A full week, ${days} days actually. Impressive avoidance.`;
  if (days > 3) return `${days} days old. Still not done. Bold.`;
  return `${days} day${days !== 1 ? 's' : ''} old and already neglected. Incredible.`;
}

function playBell() {
  try {
    const ac = new AudioContext();
    const times = [0, 0.5, 1.0];
    times.forEach(t => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = 587.3; // D5
      gain.gain.setValueAtTime(0, ac.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.35, ac.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.8);
      osc.start(ac.currentTime + t);
      osc.stop(ac.currentTime + t + 0.9);

      // Harmonic
      const osc2 = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.connect(gain2);
      gain2.connect(ac.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 880;
      gain2.gain.setValueAtTime(0, ac.currentTime + t);
      gain2.gain.linearRampToValueAtTime(0.12, ac.currentTime + t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.6);
      osc2.start(ac.currentTime + t);
      osc2.stop(ac.currentTime + t + 0.7);
    });
  } catch { /* ignore */ }
}

export default function ShameModal({ tasks, onClose }: Props) {
  const [ringing, setRinging] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTasks = tasks.filter(t => t.status !== 'done');
  const shamed = openTasks.reduce<Task | null>((oldest, t) =>
    !oldest || t.created_at < oldest.created_at ? t : oldest, null);

  const days = shamed ? daysSince(shamed.created_at) : 0;

  useEffect(() => {
    return () => { if (ringTimerRef.current) clearTimeout(ringTimerRef.current); };
  }, []);

  function ring() {
    setRinging(true);
    setRevealed(false);
    playBell();
    ringTimerRef.current = setTimeout(() => {
      setRinging(false);
      setRevealed(true);
    }, 1600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
          <span className="text-base">🔔</span>
          <span className="text-sm font-semibold text-zinc-200">The Shame Bell</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-6 text-center">
          {openTasks.length === 0 ? (
            <>
              <div className="text-5xl">🌟</div>
              <p className="text-zinc-300 text-sm">No open tasks. Nothing to shame.</p>
              <p className="text-zinc-600 text-xs">You&apos;re either very productive or you deleted everything. We&apos;re not judging.</p>
              <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors">Close</button>
            </>
          ) : (
            <>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Ring the bell to reveal your most neglected task</p>

              {/* Bell button */}
              <button
                onClick={ring}
                disabled={ringing}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center text-6xl transition-transform select-none ${
                  ringing ? '' : 'hover:scale-110 active:scale-95'
                } ${ringing ? 'animate-bounce' : ''}`}
                style={{
                  background: 'radial-gradient(circle, #78350f, #451a03)',
                  boxShadow: ringing
                    ? '0 0 40px 12px rgba(251,191,36,0.5), 0 0 80px 20px rgba(251,191,36,0.2)'
                    : '0 0 20px 4px rgba(251,191,36,0.15)',
                }}
              >
                🔔
                {ringing && (
                  <>
                    <span className="absolute -inset-4 rounded-full border-2 border-yellow-400 opacity-60 animate-ping" />
                    <span className="absolute -inset-8 rounded-full border border-yellow-500 opacity-30 animate-ping" style={{ animationDelay: '0.15s' }} />
                  </>
                )}
              </button>

              {ringing && (
                <p className="text-yellow-400 font-bold text-lg tracking-widest animate-pulse">
                  DING DING DING
                </p>
              )}

              {/* Revealed task */}
              {revealed && shamed && (
                <div className="w-full rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2">
                    🚨 Walk of Shame 🚨
                  </p>
                  <p className="text-zinc-100 text-sm font-semibold leading-snug mb-2">{shamed.title}</p>
                  <p className="text-zinc-400 text-xs italic mb-3">&ldquo;{shameMessage(shamed, days)}&rdquo;</p>
                  <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
                    <span>{shamed.priority} priority</span>
                    <span>·</span>
                    <span>{shamed.hours}h estimated</span>
                    <span>·</span>
                    <span>{days}d old</span>
                  </div>
                </div>
              )}

              {!revealed && !ringing && (
                <p className="text-zinc-700 text-xs">The bell awaits. Are you sure you want to know?</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
