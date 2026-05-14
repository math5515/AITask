'use client';

import type { Recommendation } from '@/lib/types';

interface Props {
  recommendations: Recommendation[];
  loading: boolean;
  onRefresh: () => void;
}

const RANK_COLORS = ['text-amber-400', 'text-zinc-300', 'text-zinc-500'];
const RANK_LABELS = ['Top pick', 'Second', 'Third'];

export default function RecommendationPanel({ recommendations, loading, onRefresh }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-300">What to do next</h2>
          <p className="text-xs text-zinc-600 mt-0.5">AI-powered recommendations</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↺</span>
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full mx-auto mb-3" />
            <p className="text-xs text-zinc-600">Analyzing tasks…</p>
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-2xl">🎯</p>
            <p className="text-sm text-zinc-600">Add tasks to get recommendations.</p>
          </div>
        )}

        {recommendations.map((rec, i) => (
          <div key={rec.taskId} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-widest ${RANK_COLORS[i]}`}>
                {RANK_LABELS[i]}
              </span>
              <span className="text-xs text-zinc-600">urgency {rec.urgencyScore}/10</span>
            </div>

            <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all"
                style={{ width: `${rec.urgencyScore * 10}%` }}
              />
            </div>

            <p className="text-sm font-medium text-zinc-100 leading-snug">{rec.title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{rec.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
