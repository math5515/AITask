'use client';

import { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function StandupModal({ onClose }: Props) {
  const [standup, setStandup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/standup');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate standup');
      setStandup(data.standup);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate standup');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { generate(); }, []);

  async function copy() {
    await navigator.clipboard.writeText(standup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Standup Digest</h2>
            <p className="text-xs text-zinc-500 mt-0.5">AI-generated from your tasks</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex-1">
          {loading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full" />
              <span className="text-sm text-zinc-500">Generating standup…</span>
            </div>
          )}

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && standup && (
            <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
              {standup}
            </pre>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={copy}
            disabled={loading || !standup}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-400 text-sm rounded-lg transition-colors"
            title="Regenerate"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
