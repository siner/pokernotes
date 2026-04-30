'use client';

import { useState } from 'react';
import { calculateBreakEven, PRESET_BET_SIZES } from '@/lib/calculators/breakEven';

export function BreakEvenCalc() {
  const [pot, setPot] = useState<number | ''>(100);
  const [bet, setBet] = useState<number | ''>(50);

  const parsedPot = typeof pot === 'number' && pot > 0 ? pot : 0;
  const parsedBet = typeof bet === 'number' && bet > 0 ? bet : 0;

  const result = calculateBreakEven(parsedPot, parsedBet);
  const hasValues = parsedPot > 0 && parsedBet > 0;

  function applyPreset(fraction: number) {
    if (parsedPot > 0) {
      setBet(Math.round(parsedPot * fraction));
    }
  }

  const beColor =
    result.breakEvenPct === 0
      ? 'text-slate-500'
      : result.breakEvenPct < 30
        ? 'text-emerald-400'
        : result.breakEvenPct < 45
          ? 'text-yellow-400'
          : 'text-red-400';

  const mdfColor =
    result.mdfPct === 0
      ? 'text-slate-500'
      : result.mdfPct > 70
        ? 'text-red-400'
        : result.mdfPct > 55
          ? 'text-yellow-400'
          : 'text-emerald-400';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl sm:p-6"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Pot Size
            </label>
            <input
              type="number"
              min="0"
              value={pot}
              onChange={(e) => setPot(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-lg text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              placeholder="100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Bet Size
            </label>
            <input
              type="number"
              min="0"
              value={bet}
              onChange={(e) => setBet(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-lg text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              placeholder="50"
            />
          </div>

          {/* Quick presets */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
              Quick bet sizing
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BET_SIZES.map(({ label, fraction }) => (
                <button
                  key={label}
                  onClick={() => applyPreset(fraction)}
                  disabled={parsedPot === 0}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {/* Break-even panel */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Break-Even (attacker)
              </p>
            </div>
            <p className={`font-mono text-4xl font-bold tracking-tight sm:text-5xl ${beColor}`}>
              {hasValues ? `${result.breakEvenPct.toFixed(1)}%` : '—'}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Bluff must succeed this often to break even
            </p>
          </div>

          {/* MDF panel */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                MDF (defender)
              </p>
            </div>
            <p className={`font-mono text-4xl font-bold tracking-tight sm:text-5xl ${mdfColor}`}>
              {hasValues ? `${result.mdfPct.toFixed(1)}%` : '—'}
            </p>
            <p className="mt-2 text-xs text-slate-600">Minimum of your range you must continue</p>
          </div>

          {/* Pot after call */}
          {hasValues && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-500">
              <span>
                Pot if called:{' '}
                <span className="font-mono font-semibold text-slate-300">
                  {result.potAfterBet.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-700" aria-hidden="true">
                ·
              </span>
              <span>
                Bet/Pot ratio:{' '}
                <span className="font-mono font-semibold text-slate-300">
                  {result.betToPotRatio}x
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
