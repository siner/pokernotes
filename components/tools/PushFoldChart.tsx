'use client';

import { useState } from 'react';
import { POSITIONS, RANKS, Position, shouldPush } from '@/lib/calculators/pushFold';

export function PushFoldChart() {
  const [bb, setBb] = useState<number>(10);
  const [position, setPosition] = useState<Position>('BTN');

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl sm:p-6"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        {/* BB slider */}
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Stack Size
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
            <div className="min-w-[56px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-center font-mono text-sm font-bold text-emerald-400">
              {bb}bb
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>1bb</span>
            <span>10bb</span>
            <span>20bb</span>
          </div>
        </div>

        {/* Position selector */}
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Your Position
          </label>
          <div className="flex flex-wrap gap-1.5">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  position === pos
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hand grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid w-full min-w-[520px] grid-cols-13 gap-0.5 rounded-xl border border-slate-800 bg-slate-950 p-0.5">
          {RANKS.map((r1, i) =>
            RANKS.map((r2, j) => {
              const isPair = i === j;
              const isSuited = j > i;
              let handStr: string;

              if (isPair) {
                handStr = `${r1}${r2}`;
              } else if (isSuited) {
                handStr = `${r1}${r2}s`;
              } else {
                handStr = `${r2}${r1}o`;
              }

              const isPushing = shouldPush(handStr, bb, position);

              return (
                <div
                  key={handStr}
                  className={`flex aspect-square items-center justify-center rounded-sm text-[9px] font-semibold sm:text-[10px] ${
                    isPushing
                      ? 'bg-emerald-500/75 text-white'
                      : 'bg-slate-900/80 text-slate-600 hover:bg-slate-800/80 hover:text-slate-500'
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

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-sm bg-emerald-500/75" />
            <span>Push All-in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-sm border border-slate-700 bg-slate-900/80" />
            <span>Fold</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600">
          Top-right = suited · Bottom-left = offsuit · Diagonal = pairs
        </div>
      </div>
    </div>
  );
}
