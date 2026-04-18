'use client';

import { useState } from 'react';
import { POSITIONS, RANKS, Position, shouldPush } from '@/lib/calculators/pushFold';

export function PushFoldChart() {
  const [bb, setBb] = useState<number>(10);
  const [position, setPosition] = useState<Position>('BTN');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl">
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Stack Size (Big Blinds)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={bb}
              onChange={(e) => setBb(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <span className="min-w-[48px] rounded-lg bg-slate-800 px-3 py-1 text-center font-mono text-emerald-400">
              {bb}bb
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Your Position</label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  position === pos
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-grid w-full min-w-[600px] grid-cols-13 gap-0.5 rounded-xl border border-slate-700 bg-slate-800 p-0.5">
          {RANKS.map((r1, i) =>
            RANKS.map((r2, j) => {
              // Diagonal: Pairs
              // Top-Right: Suited
              // Bottom-Left: Offsuit
              let handStr: string;
              const isPair = i === j;
              const isSuited = j > i;

              if (isPair) {
                handStr = `${r1}${r2}`;
              } else if (isSuited) {
                handStr = `${r1}${r2}s`;
              } else {
                handStr = `${r2}${r1}o`; // Note order inversion so high card is first in offsuit
              }

              const isPushing = shouldPush(handStr, bb, position);

              return (
                <div
                  key={handStr}
                  className={`flex aspect-square items-center justify-center rounded-sm text-[10px] sm:text-xs font-semibold ${
                    isPushing
                      ? 'bg-emerald-500/80 text-white shadow-inner shadow-emerald-400/50'
                      : 'bg-slate-900/60 text-slate-500 hover:bg-slate-800 hover:text-slate-400'
                  }`}
                  title={handStr}
                >
                  {handStr}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="block h-3 w-3 rounded-sm bg-emerald-500/80" />
          <span>Push All-in</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="block h-3 w-3 rounded-sm bg-slate-900/60 border border-slate-700" />
          <span>Fold</span>
        </div>
      </div>
    </div>
  );
}
