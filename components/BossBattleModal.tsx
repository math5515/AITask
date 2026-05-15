'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  onCompleteTask: (id: number) => Promise<void>;
  onClose: () => void;
}

// Pixel art monster blueprints — each is a 12x10 grid of color indices
// 0 = transparent, 1 = body, 2 = highlight, 3 = shadow, 4 = eye, 5 = detail
const MONSTERS: { pixels: number[][]; palette: (priority: Task['priority']) => string[] }[] = [
  {
    // Dragon (high priority)
    pixels: [
      [0,0,0,1,1,1,1,1,0,0,0,0],
      [0,0,1,2,1,1,1,2,1,0,0,0],
      [0,1,2,1,1,4,4,1,1,2,1,0],
      [1,1,1,1,4,4,4,4,1,1,1,1],
      [1,3,1,1,1,1,1,1,1,1,3,1],
      [0,1,1,5,1,1,1,1,5,1,1,0],
      [0,0,1,1,1,3,3,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,1,1,1,1,1,0,1,0,0],
      [0,0,0,1,0,0,0,1,0,0,0,0],
    ],
    palette: () => ['transparent','#dc2626','#fca5a5','#991b1b','#fef08a','#f97316'],
  },
  {
    // Troll (medium priority)
    pixels: [
      [0,0,1,1,1,1,1,1,1,0,0,0],
      [0,1,1,2,1,1,2,1,1,1,0,0],
      [1,1,1,1,4,1,1,4,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,0],
      [1,3,1,5,1,1,1,5,1,3,1,0],
      [0,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,3,1,1,3,1,1,0,0],
      [0,0,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,0,1,1,1,0,1,0,0,0],
      [0,0,1,0,0,0,0,0,1,0,0,0],
    ],
    palette: () => ['transparent','#d97706','#fde68a','#92400e','#fef08a','#dc2626'],
  },
  {
    // Slime (low priority)
    pixels: [
      [0,0,0,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,2,2,1,1,0,0,0,0],
      [0,1,1,2,1,4,4,2,1,0,0,0],
      [1,1,1,1,1,4,4,1,1,1,0,0],
      [1,1,3,1,1,1,1,1,3,1,0,0],
      [1,1,1,5,1,1,1,5,1,1,0,0],
      [0,1,1,1,3,1,3,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,0,0,1,0,0,0,0,0],
    ],
    palette: () => ['transparent','#16a34a','#86efac','#14532d','#fef08a','#22d3ee'],
  },
];

function getMonsterIndex(priority: Task['priority']): number {
  return priority === 'high' ? 0 : priority === 'medium' ? 1 : 2;
}

function drawMonster(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  priority: Task['priority'],
  scale: number,
  shake: number,
  flashWhite: boolean,
) {
  const mi = getMonsterIndex(priority);
  const { pixels, palette } = MONSTERS[mi];
  const colors = palette(priority);
  const pw = 12, ph = 10;
  const ox = cx - (pw * scale) / 2 + shake;
  const oy = cy - (ph * scale) / 2;

  for (let row = 0; row < ph; row++) {
    for (let col = 0; col < pw; col++) {
      const ci = pixels[row][col];
      if (ci === 0) continue;
      ctx.fillStyle = flashWhite ? 'white' : colors[ci];
      ctx.fillRect(ox + col * scale, oy + row * scale, scale, scale);
    }
  }
}

function playHitSound() {
  try {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ac.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    osc.start();
    osc.stop(ac.currentTime + 0.15);
  } catch { /* ignore */ }
}

function playDeathSound() {
  try {
    const ac = new AudioContext();
    const freqs = [440, 550, 660, 440];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, ac.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, ac.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.2);
      osc.start(ac.currentTime + i * 0.1);
      osc.stop(ac.currentTime + i * 0.1 + 0.3);
    });
  } catch { /* ignore */ }
}

export default function BossBattleModal({ tasks, onCompleteTask, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const shakeRef = useRef(0);
  const flashRef = useRef(0);
  const tickRef = useRef(0);
  const bossesRef = useRef<{ task: Task; hp: number; maxHp: number }[]>([]);
  const [bossIdx, setBossIdx] = useState(0);
  const [hpDisplay, setHpDisplay] = useState<{ hp: number; maxHp: number } | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [allDefeated, setAllDefeated] = useState(false);
  const [defeatedCount, setDefeatedCount] = useState(0);

  const openTasks = tasks.filter(t => t.status !== 'done');

  useEffect(() => {
    bossesRef.current = openTasks.map(t => ({
      task: t,
      hp: Math.round(t.hours * 15 + (t.priority === 'high' ? 60 : t.priority === 'medium' ? 30 : 10)),
      maxHp: Math.round(t.hours * 15 + (t.priority === 'high' ? 60 : t.priority === 'medium' ? 30 : 10)),
    }));
    if (bossesRef.current.length > 0) {
      setHpDisplay({ hp: bossesRef.current[0].hp, maxHp: bossesRef.current[0].maxHp });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    tickRef.current++;

    // BG
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0514');
    bg.addColorStop(1, '#1a0a00');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = '#1c1008';
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = '#2d1a0a';
    ctx.fillRect(0, H * 0.72, W, 4);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 73.1 + 17) % 100) / 100 * W;
      const sy = ((i * 47.3) % 60) / 100 * H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    const boss = bossesRef.current[bossIdx];
    if (!boss) return;

    const shake = shakeRef.current > 0 ? (Math.random() - 0.5) * 10 : 0;
    const flash = flashRef.current > 0;
    if (shakeRef.current > 0) shakeRef.current--;
    if (flashRef.current > 0) flashRef.current--;

    const scale = Math.round(Math.min(W, H * 0.6) / 16);
    const cx = W / 2;
    const cy = H * 0.45;

    // Bob animation
    const bob = Math.sin(tickRef.current * 0.06) * 4;
    drawMonster(ctx, cx, cy + bob, boss.task.priority, scale, shake, flash);

    // HP bar overlay
    const barW = Math.min(W - 40, 280);
    const barH = 10;
    const bx = (W - barW) / 2;
    const by = H * 0.78;
    const pct = boss.hp / boss.maxHp;

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 5);
    ctx.fill();

    ctx.fillStyle = pct > 0.5 ? '#16a34a' : pct > 0.25 ? '#d97706' : '#dc2626';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * pct, barH, 5);
    ctx.fill();

    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 5);
    ctx.stroke();

    animRef.current = requestAnimationFrame(drawFrame);
  }, [bossIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    animRef.current = requestAnimationFrame(drawFrame);
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [drawFrame]);

  async function attack() {
    if (attacking) return;
    const boss = bossesRef.current[bossIdx];
    if (!boss) return;

    const dmg = Math.round(25 + Math.random() * 20);
    boss.hp = Math.max(0, boss.hp - dmg);
    shakeRef.current = 8;
    flashRef.current = 4;
    playHitSound();
    setHpDisplay({ hp: boss.hp, maxHp: boss.maxHp });

    if (boss.hp <= 0) {
      playDeathSound();
      setAttacking(true);
      await onCompleteTask(boss.task.id);
      setDefeatedCount(c => c + 1);
      setAttacking(false);

      const nextIdx = bossIdx + 1;
      if (nextIdx >= bossesRef.current.length) {
        setAllDefeated(true);
      } else {
        setBossIdx(nextIdx);
        setHpDisplay({
          hp: bossesRef.current[nextIdx].hp,
          maxHp: bossesRef.current[nextIdx].maxHp,
        });
      }
    }
  }

  const boss = bossesRef.current[bossIdx];

  if (openTasks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-8 text-center shadow-2xl">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-zinc-300 text-sm mb-1">No bosses remain!</p>
          <p className="text-zinc-600 text-xs mb-6">All tasks are done. You&apos;re a legend.</p>
          <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm flex flex-col rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden bg-zinc-950">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
          <span className="text-base">👹</span>
          <span className="text-sm font-semibold text-zinc-200">Boss Battle</span>
          <span className="text-zinc-600 text-xs ml-1">— defeat your tasks</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {allDefeated ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="text-5xl">🏆</div>
            <h3 className="text-xl font-bold text-yellow-400">VICTORY!</h3>
            <p className="text-zinc-400 text-sm">
              You defeated {defeatedCount} boss{defeatedCount !== 1 ? 'es' : ''}!<br />
              All tasks marked complete.
            </p>
            <button onClick={onClose} className="mt-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors">
              Claim Victory
            </button>
          </div>
        ) : (
          <>
            {/* Boss info */}
            {boss && (
              <div className="px-5 pt-3 pb-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-zinc-200 text-xs font-semibold truncate max-w-[200px]">{boss.task.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    boss.task.priority === 'high' ? 'bg-red-900 text-red-300' :
                    boss.task.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {boss.task.priority}
                  </span>
                </div>
                {hpDisplay && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${(hpDisplay.hp / hpDisplay.maxHp) * 100}%`,
                          background: hpDisplay.hp / hpDisplay.maxHp > 0.5 ? '#16a34a' :
                            hpDisplay.hp / hpDisplay.maxHp > 0.25 ? '#d97706' : '#dc2626',
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{hpDisplay.hp}/{hpDisplay.maxHp} HP</span>
                  </div>
                )}
              </div>
            )}

            {/* Battle canvas */}
            <div className="relative mx-3 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Controls */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Boss {bossIdx + 1} of {bossesRef.current.length}</span>
                <span>{defeatedCount} defeated</span>
              </div>
              <button
                onClick={attack}
                disabled={attacking}
                className="w-full py-3.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-lg transition-colors shadow-lg"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {attacking ? 'Completing…' : '⚔️ ATTACK'}
              </button>
              <p className="text-zinc-700 text-xs text-center">Completing the task defeats the boss</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
