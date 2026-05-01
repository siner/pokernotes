'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { calculateICM } from '@/lib/calculators/icm';
import { Plus, Trash2 } from 'lucide-react';

export function ICMCalc() {
  const t = useTranslations('tools.icm');
  const currencySymbol = t('currencySymbol');

  const [stacks, setStacks] = useState<number[]>([10000, 5000, 2000]);
  const [payouts, setPayouts] = useState<number[]>([500, 300, 200]);

  const totalChips = stacks.reduce((a, b) => a + b, 0);
  const totalPrize = payouts.reduce((a, b) => a + b, 0);
  const results = calculateICM(stacks, payouts);

  const updateStack = (idx: number, val: number) => {
    const newStacks = [...stacks];
    newStacks[idx] = val;
    setStacks(newStacks);
  };

  const updatePayout = (idx: number, val: number) => {
    const newPayouts = [...payouts];
    newPayouts[idx] = val;
    setPayouts(newPayouts);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 font-mono text-base text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30';

  const dotGrid = {
    backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  };

  return (
    <div className="grid gap-6">
      {/* Inputs */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl grid gap-6 sm:p-6 md:grid-cols-2"
        style={dotGrid}
      >
        {/* Stacks */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Player Stacks
            </p>
            <button
              onClick={() => setStacks([...stacks, 1000])}
              className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {stacks.map((stack, i) => (
              <div key={`stack-${i}`} className="flex items-center gap-2">
                <span className="w-7 text-center text-xs font-mono text-slate-500">P{i + 1}</span>
                <input
                  type="number"
                  min="0"
                  value={stack || ''}
                  onChange={(e) => updateStack(i, Number(e.target.value))}
                  className={inputClass}
                />
                <button
                  onClick={() => setStacks(stacks.filter((_, idx) => idx !== i))}
                  disabled={stacks.length <= 2}
                  className="text-slate-600 hover:text-red-400 disabled:opacity-30"
                  aria-label="Remove player"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payouts */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Payout Structure
            </p>
            <button
              onClick={() => setPayouts([...payouts, 100])}
              className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {payouts.map((prize, i) => (
              <div key={`prize-${i}`} className="flex items-center gap-2">
                <span className="w-7 text-center text-xs font-mono text-slate-500">
                  {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                </span>
                <input
                  type="number"
                  min="0"
                  value={prize || ''}
                  onChange={(e) => updatePayout(i, Number(e.target.value))}
                  className={inputClass}
                />
                <button
                  onClick={() => setPayouts(payouts.filter((_, idx) => idx !== i))}
                  disabled={payouts.length <= 1}
                  className="text-slate-600 hover:text-red-400 disabled:opacity-30"
                  aria-label="Remove prize"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-xs text-slate-500 md:col-span-2">
          <span>
            Total chips:{' '}
            <span className="font-mono font-semibold text-slate-300">
              {totalChips.toLocaleString()}
            </span>
          </span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span>
            Prize pool:{' '}
            <span className="font-mono font-semibold text-slate-300">
              {currencySymbol}
              {totalPrize.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            ICM Model Results
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 border-b border-slate-800 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500 sm:px-4">
            <span>Player</span>
            <span>Chips</span>
            <span className="text-right">ICM Value</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {stacks.map((stack, i) => {
              const icmValue = results[i] ?? 0;
              const chipPct = totalChips > 0 ? (stack / totalChips) * 100 : 0;
              const poolPct = totalPrize > 0 ? (icmValue / totalPrize) * 100 : 0;
              const isChipLeader = i === stacks.indexOf(Math.max(...stacks));
              return (
                <div
                  key={`res-${i}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-slate-800/20 sm:px-4"
                >
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-mono text-sm">P{i + 1}</span>
                    {isChipLeader && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">
                        lead
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm text-slate-300">
                      {stack.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-600">{chipPct.toFixed(1)}% chips</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-emerald-400">
                      {currencySymbol}
                      {icmValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {poolPct.toFixed(1)}% pool
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {stacks.length > 0 && results.length > 0 && (
          <p className="mt-3 text-xs text-slate-600">
            ICM redistributes chip-EV into dollar-EV accounting for payout structure — chips ≠
            dollars near the bubble.
          </p>
        )}
      </div>
    </div>
  );
}
