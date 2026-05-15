'use client';

import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
}

const SIGNS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const CACHE_KEY = 'taskflow_horoscope';

export default function HoroscopeModal({ onClose }: Props) {
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sign] = useState(() => SIGNS[Math.floor(Math.random() * SIGNS.length)]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached?.date === today) {
      setHoroscope(cached.horoscope);
      setLoading(false);
      return;
    }

    fetch('/api/horoscope')
      .then(r => r.json())
      .then(data => {
        setHoroscope(data.horoscope);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ horoscope: data.horoscope, date: today }));
      })
      .catch(() => setHoroscope('The stars are offline. Mercury is probably in retrograde again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at top, #1a0a3d 0%, #09090b 100%)' }}>

        {/* Stars bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() > 0.8 ? 2 : 1,
                height: Math.random() > 0.8 ? 2 : 1,
                left: `${(i * 73.1) % 100}%`,
                top: `${(i * 47.3) % 70}%`,
                opacity: 0.2 + (i % 5) * 0.12,
              }}
            />
          ))}
        </div>

        <div className="relative px-6 pt-8 pb-6">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Sign */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.6))' }}>
              {sign}
            </div>
            <p className="text-violet-400 text-xs uppercase tracking-widest font-semibold">
              Productivity Horoscope
            </p>
            <p className="text-zinc-600 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Content */}
          <div className="min-h-[100px] flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-2xl animate-spin">🔮</div>
                <p className="text-zinc-500 text-sm">Consulting the stars&hellip;</p>
              </div>
            ) : (
              <p className="text-zinc-200 text-sm leading-relaxed text-center italic">
                &ldquo;{horoscope}&rdquo;
              </p>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-zinc-700 text-xs">Updated daily · Powered by actual tasks</p>
              <button
                onClick={() => {
                  localStorage.removeItem(CACHE_KEY);
                  setLoading(true);
                  fetch('/api/horoscope')
                    .then(r => r.json())
                    .then(data => {
                      setHoroscope(data.horoscope);
                      const today = new Date().toISOString().split('T')[0];
                      localStorage.setItem(CACHE_KEY, JSON.stringify({ horoscope: data.horoscope, date: today }));
                    })
                    .catch(() => setHoroscope('The stars remain silent.'))
                    .finally(() => setLoading(false));
                }}
                className="text-xs text-violet-500 hover:text-violet-300 transition-colors"
              >
                Re-read stars
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
