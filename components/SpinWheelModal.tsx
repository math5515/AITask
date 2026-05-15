'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  onClose: () => void;
}

const COLORS = [
  '#4f46e5', '#7c3aed', '#a21caf', '#be185d',
  '#0f766e', '#1d4ed8', '#9333ea', '#0369a1',
];

const TAU = Math.PI * 2;

export default function SpinWheelModal({ tasks, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const spinningRef = useRef(false);
  const [winner, setWinner] = useState<Task | null>(null);
  const [hasSpun, setHasSpun] = useState(false);

  const openTasks = tasks.filter(t => t.status !== 'done');

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(cx, cy) - 20;
    const n = openTasks.length;

    ctx.clearRect(0, 0, W, H);

    if (n === 0) return;

    const arc = TAU / n;

    for (let i = 0; i < n; i++) {
      const start = angle + i * arc;
      const end = start + arc;
      const mid = start + arc / 2;

      // Segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx + Math.cos(mid) * r * 0.65, cy + Math.sin(mid) * r * 0.65);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, Math.min(13, Math.floor(r / n * 1.2)))}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = openTasks[i].title.length > 16
        ? openTasks[i].title.slice(0, 15) + '…'
        : openTasks[i].title;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, TAU);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 11px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎲', cx, cy);

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx - 12, 4);
    ctx.lineTo(cx + 12, 4);
    ctx.lineTo(cx, 28);
    ctx.closePath();
    ctx.fillStyle = '#f4f4f5';
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [openTasks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawWheel(angleRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [drawWheel]);

  function spin() {
    if (spinningRef.current || openTasks.length === 0) return;
    setWinner(null);
    setHasSpun(true);
    spinningRef.current = true;
    velRef.current = 0.22 + Math.random() * 0.18;

    const tick = () => {
      velRef.current *= 0.988;
      angleRef.current += velRef.current;
      drawWheel(angleRef.current);

      if (velRef.current > 0.001) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        spinningRef.current = false;

        // Determine winner: pointer is at top (angle = -π/2 relative to 0)
        // segment i starts at angle + i * arc
        const n = openTasks.length;
        const arc = TAU / n;
        const norm = (((-Math.PI / 2) - angleRef.current) % TAU + TAU) % TAU;
        const idx = Math.floor(norm / arc) % n;
        setWinner(openTasks[idx]);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }

  if (openTasks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-8 text-center shadow-2xl">
          <div className="text-4xl mb-4">🎰</div>
          <p className="text-zinc-300 text-sm mb-1">No open tasks to spin!</p>
          <p className="text-zinc-600 text-xs mb-6">Add some tasks first.</p>
          <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
          <span className="text-base">🎡</span>
          <span className="text-sm font-semibold text-zinc-200">Spin the Wheel</span>
          <span className="text-zinc-600 text-xs ml-1">— fate decides</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative" style={{ paddingBottom: '100%' }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        <div className="px-5 py-4 flex flex-col items-center gap-3">
          {winner ? (
            <div className="w-full rounded-lg border border-indigo-500 bg-indigo-950/50 px-4 py-3 text-center">
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide mb-1">The wheel has spoken</p>
              <p className="text-zinc-100 text-sm font-medium">{winner.title}</p>
              <p className="text-zinc-500 text-xs mt-1">{winner.priority} priority · {winner.hours}h</p>
            </div>
          ) : hasSpun ? (
            <div className="h-[68px]" />
          ) : (
            <p className="text-zinc-600 text-xs text-center">Can&apos;t decide what to work on? Let fate choose.</p>
          )}

          <button
            onClick={spin}
            disabled={spinningRef.current}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {spinningRef.current ? 'Spinning…' : winner ? 'Spin Again' : 'Spin!'}
          </button>
        </div>
      </div>
    </div>
  );
}
