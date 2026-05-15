'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface TitanicGameProps {
  onClose: () => void;
}

interface Iceberg {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  sway: number;
  swayOffset: number;
}

const SHIP_WIDTH = 44;
const SHIP_HEIGHT = 56;
const MIN_ICEBERG_W = 38;
const MAX_ICEBERG_W = 90;
const MIN_ICEBERG_H = 28;
const MAX_ICEBERG_H = 60;

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, hit: boolean) {
  const cx = x;
  const by = y + SHIP_HEIGHT / 2;

  // Hull
  ctx.fillStyle = hit ? '#dc2626' : '#1e3a5f';
  ctx.beginPath();
  ctx.moveTo(cx - SHIP_WIDTH / 2, by);
  ctx.lineTo(cx - SHIP_WIDTH / 2 + 4, by - 12);
  ctx.lineTo(cx + SHIP_WIDTH / 2 - 4, by - 12);
  ctx.lineTo(cx + SHIP_WIDTH / 2, by);
  ctx.closePath();
  ctx.fill();

  // Deck
  ctx.fillStyle = hit ? '#b91c1c' : '#2c5282';
  ctx.fillRect(cx - SHIP_WIDTH / 2 + 4, by - 22, SHIP_WIDTH - 8, 10);

  // Funnel 1
  ctx.fillStyle = hit ? '#991b1b' : '#e53e3e';
  ctx.fillRect(cx - 10, by - 38, 8, 16);
  // Funnel top
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 11, by - 42, 10, 5);

  // Funnel 2
  ctx.fillStyle = hit ? '#991b1b' : '#e53e3e';
  ctx.fillRect(cx + 2, by - 34, 7, 12);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx + 1, by - 38, 9, 5);

  // Smoke puffs
  if (!hit) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#cbd5e0';
    ctx.beginPath();
    ctx.arc(cx - 6, by - 46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 2, by - 52, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Waterline
  ctx.strokeStyle = '#63b3ed';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - SHIP_WIDTH / 2, by);
  ctx.lineTo(cx + SHIP_WIDTH / 2, by);
  ctx.stroke();
}

function drawIceberg(ctx: CanvasRenderingContext2D, berg: Iceberg) {
  const { x, y, w, h } = berg;
  ctx.fillStyle = '#a8d8ea';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x - w * 0.1, y + h * 0.6);
  ctx.lineTo(x - w * 0.3, y + h * 0.4);
  ctx.lineTo(x - w * 0.2, y + h * 0.15);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w * 0.15, y + h * 0.1);
  ctx.lineTo(x + w * 0.3, y + h * 0.25);
  ctx.lineTo(x + w * 0.2, y + h * 0.45);
  ctx.lineTo(x + w * 0.35, y + h * 0.65);
  ctx.lineTo(x + w * 0.1, y + h);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#e2f4fb';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.12, y + h * 0.08);
  ctx.lineTo(x + w * 0.05, y + h * 0.22);
  ctx.lineTo(x - w * 0.05, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  // Underwater (translucent bulk)
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#63b3ed';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.1, y + h + h * 0.4, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawOcean(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#0a0e1a');
  sky.addColorStop(1, '#0f2044');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const rng = (n: number) => ((Math.sin(n * 127.1) * 43758.5453) % 1 + 1) % 1;
  for (let i = 0; i < 60; i++) {
    const sx = rng(i) * w;
    const sy = rng(i + 100) * h * 0.45;
    const flicker = 0.5 + 0.5 * Math.sin(tick * 0.04 + i * 2.3);
    ctx.globalAlpha = flicker * 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.1, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0e1a';
  ctx.beginPath();
  ctx.arc(w * 0.82 + 8, h * 0.1 - 4, 14, 0, Math.PI * 2);
  ctx.fill();

  // Ocean
  const ocean = ctx.createLinearGradient(0, h * 0.55, 0, h);
  ocean.addColorStop(0, '#0d2137');
  ocean.addColorStop(1, '#061020');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Wave lines
  ctx.strokeStyle = 'rgba(99,179,237,0.12)';
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 6; row++) {
    const wy = h * 0.57 + row * (h * 0.07);
    ctx.beginPath();
    for (let px = 0; px <= w; px += 4) {
      const waveY = wy + Math.sin((px + tick * (1.2 + row * 0.3)) * 0.04) * (3 + row);
      px === 0 ? ctx.moveTo(px, waveY) : ctx.lineTo(px, waveY);
    }
    ctx.stroke();
  }
}

export default function TitanicGame({ onClose }: TitanicGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    shipX: 0,
    shipY: 0,
    icebergs: [] as Iceberg[],
    score: 0,
    best: 0,
    tick: 0,
    alive: true,
    hitTimer: 0,
    spawnTimer: 0,
    spawnInterval: 90,
    speed: 1,
    leftHeld: false,
    rightHeld: false,
    shipVx: 0,
    touchStartX: null as number | null,
    animId: 0,
  });
  const [phase, setPhase] = useState<'start' | 'playing' | 'dead'>('start');
  const phaseRef = useRef<'start' | 'playing' | 'dead'>('start');

  function setPhaseSync(p: 'start' | 'playing' | 'dead') {
    phaseRef.current = p;
    setPhase(p);
  }

  const spawnIceberg = useCallback((canvasW: number) => {
    const w = MIN_ICEBERG_W + Math.random() * (MAX_ICEBERG_W - MIN_ICEBERG_W);
    const h = MIN_ICEBERG_H + Math.random() * (MAX_ICEBERG_H - MIN_ICEBERG_H);
    const x = w / 2 + Math.random() * (canvasW - w);
    const s = stateRef.current;
    stateRef.current.icebergs.push({
      x, y: -h - 10, w, h,
      speed: (1.5 + Math.random() * 1.2) * s.speed,
      sway: (Math.random() - 0.5) * 0.6,
      swayOffset: Math.random() * Math.PI * 2,
    });
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    s.shipX = canvas.width / 2;
    s.shipY = canvas.height - 80;
    s.icebergs = [];
    s.score = 0;
    s.tick = 0;
    s.alive = true;
    s.hitTimer = 0;
    s.spawnTimer = 0;
    s.spawnInterval = 90;
    s.speed = 1;
    s.shipVx = 0;
    setPhaseSync('playing');
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    const W = canvas.width;
    const H = canvas.height;

    if (phaseRef.current === 'playing' && s.alive) {
      s.tick++;
      s.score = Math.floor(s.tick / 6);

      // Speed ramp
      s.speed = 1 + s.tick / 1800;
      if (s.tick % 120 === 0 && s.spawnInterval > 35) s.spawnInterval--;

      // Ship movement
      const accel = 0.6;
      const maxV = 7;
      if (s.leftHeld) s.shipVx = Math.max(s.shipVx - accel, -maxV);
      else if (s.rightHeld) s.shipVx = Math.min(s.shipVx + accel, maxV);
      else s.shipVx *= 0.82;

      s.shipX = Math.max(SHIP_WIDTH / 2, Math.min(W - SHIP_WIDTH / 2, s.shipX + s.shipVx));

      // Spawn
      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        spawnIceberg(W);
      }

      // Move icebergs
      for (const berg of s.icebergs) {
        berg.y += berg.speed * s.speed;
        berg.x += berg.sway * Math.sin(s.tick * 0.05 + berg.swayOffset);
      }

      // Remove off-screen
      s.icebergs = s.icebergs.filter(b => b.y < H + b.h + 20);

      // Collision
      if (s.hitTimer === 0) {
        for (const berg of s.icebergs) {
          const dx = Math.abs(s.shipX - (berg.x + berg.w * 0.1));
          const dy = Math.abs(s.shipY - (berg.y + berg.h / 2));
          if (dx < (SHIP_WIDTH / 2 + berg.w * 0.45) && dy < (SHIP_HEIGHT / 2 + berg.h * 0.45)) {
            s.alive = false;
            s.hitTimer = 80;
            if (s.score > s.best) s.best = s.score;
            break;
          }
        }
      }
    }

    if (s.hitTimer > 0) s.hitTimer--;
    if (!s.alive && s.hitTimer === 0 && phaseRef.current === 'playing') {
      setPhaseSync('dead');
    }

    // Draw
    drawOcean(ctx, W, H, s.tick);

    for (const berg of s.icebergs) drawIceberg(ctx, berg);

    if (phaseRef.current === 'playing') {
      drawShip(ctx, s.shipX, s.shipY, !s.alive);
    }

    // HUD score
    if (phaseRef.current === 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 60, 12, 120, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `bold 13px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${s.score} nautical mi`, W / 2, 35);
    }

    s.animId = requestAnimationFrame(gameLoop);
  }, [spawnIceberg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stateRef.current.shipX = canvas.width / 2;
      stateRef.current.shipY = canvas.height - 80;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    stateRef.current.animId = requestAnimationFrame(gameLoop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(stateRef.current.animId);
    };
  }, [gameLoop]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftHeld = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightHeld = true;
      if (e.key === 'Escape') onClose();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftHeld = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightHeld = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [onClose]);

  // Touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    stateRef.current.touchStartX = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relX = touch.clientX - rect.left;
    // Steer ship toward touch X
    const s = stateRef.current;
    const diff = relX - s.shipX;
    const maxV = 8;
    s.shipVx = Math.max(-maxV, Math.min(maxV, diff * 0.18));
    s.leftHeld = false;
    s.rightHeld = false;
  }, []);

  const handleTouchEnd = useCallback(() => {
    stateRef.current.leftHeld = false;
    stateRef.current.rightHeld = false;
    stateRef.current.shipVx *= 0.3;
    stateRef.current.touchStartX = null;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0">
      <div className="relative w-full h-full max-w-2xl max-h-[700px] m-auto rounded-xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col">
        {/* Header bar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800 z-10">
          <span className="text-base">🚢</span>
          <span className="text-sm font-semibold text-zinc-200 tracking-wide">RMS Taskflow — Iceberg Dodge</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">← → or A/D to steer • drag on mobile</span>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded"
              aria-label="Close game"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 bg-[#0a0e1a] touch-none">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Start overlay */}
          {phase === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60">
              <div className="text-center space-y-2">
                <div className="text-5xl">🚢</div>
                <h2 className="text-2xl font-bold text-white">RMS Taskflow</h2>
                <p className="text-zinc-400 text-sm">The unsinkable task manager.</p>
                <p className="text-zinc-500 text-xs mt-1">Steer clear of the icebergs.<br />They said it couldn&apos;t sink. Prove them right.</p>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm shadow-lg"
              >
                Full Steam Ahead
              </button>
              <p className="text-zinc-600 text-xs">← → / A D / drag to steer</p>
            </div>
          )}

          {/* Dead overlay */}
          {phase === 'dead' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/70">
              <div className="text-center space-y-1">
                <div className="text-5xl">🧊</div>
                <h2 className="text-xl font-bold text-red-400">We hit an iceberg!</h2>
                <p className="text-zinc-400 text-sm mt-2">
                  Distance: <span className="text-white font-semibold">{stateRef.current.score} nautical mi</span>
                </p>
                {stateRef.current.score >= stateRef.current.best && stateRef.current.score > 0 && (
                  <p className="text-yellow-400 text-xs font-semibold">New best!</p>
                )}
                {stateRef.current.best > 0 && (
                  <p className="text-zinc-500 text-xs">
                    Best: {stateRef.current.best} nautical mi
                  </p>
                )}
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm shadow-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
