'use client';

import { useState } from 'react';
import type { Task, ExtractedTask } from '@/lib/types';
import PriorityBadge from './PriorityBadge';

interface Props {
  onTaskAdded: (task: Task) => void;
}

export default function InputPanel({ onTaskAdded }: Props) {
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ExtractedTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!message.trim()) return;
    setAnalyzing(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setPreview(data.task as ExtractedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: preview, raw_input: message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      onTaskAdded(data.task as Task);
      setMessage('');
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (preview) confirm();
      else analyze();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300">Paste Message</h2>
        <p className="text-xs text-zinc-600 mt-0.5">Slack, email, or any ask</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Slack message or email here…"
          className="w-full h-44 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed"
        />

        <button
          onClick={analyze}
          disabled={!message.trim() || analyzing}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
              Analyzing…
            </span>
          ) : (
            'Analyze  ⌘↵'
          )}
        </button>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {preview && (
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Preview</span>
              <PriorityBadge priority={preview.priority} />
            </div>

            <p className="text-sm font-medium text-zinc-100 leading-snug">{preview.title}</p>

            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-zinc-400">
              <span>⏱ {preview.hours}h estimated</span>
              {preview.requester && <span>👤 {preview.requester}</span>}
              {preview.deadline && (
                <span className="col-span-2">📅 Due {preview.deadline}</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirm}
                disabled={saving}
                className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Confirm & Add  ⌘↵'}
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 text-sm rounded-lg transition-colors"
                title="Dismiss preview"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
