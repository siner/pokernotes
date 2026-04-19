'use client';

import { useState } from 'react';
import { calculatePotOdds, potOddsPercent } from '@/lib/calculators/potOdds';

export function PotOddsCalc() {
  const [potSize, setPotSize] = useState<number | ''>(100);
  const [betToCall, setBetToCall] = useState<number | ''>(50);

  const parsedPot = typeof potSize === 'number' && potSize > 0 ? potSize : 0;
  const parsedBet = typeof betToCall === 'number' && betToCall > 0 ? betToCall : 0;

  const odds = calculatePotOdds(parsedPot, parsedBet);
  const percent = potOddsPercent(parsedPot, parsedBet);
  const hasValues = parsedPot > 0 && parsedBet > 0;

  const equityColor =
    percent === 0
      ? 'text-slate-500'
      : percent < 25
        ? 'text-emerald-400'
        : percent < 40
          ? 'text-yellow-400'
          : 'text-red-400';

  const barColor =
    percent === 0
      ? 'bg-slate-700'
      : percent < 25
        ? 'bg-emerald-500'
        : percent < 40
          ? 'bg-yellow-500'
          : 'bg-red-500';

  const totalPot = parsedPot + parsedBet;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Current Pot Size
            </label>
            <input
              type="number"
              min="0"
              value={potSize}
              onChange={(e) => setPotSize(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-lg text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              placeholder="100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Bet to Call
            </label>
            <input
              type="number"
              min="0"
              value={betToCall}
              onChange={(e) => setBetToCall(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-lg text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              placeholder="50"
            />
          </div>

          {hasValues && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-500">
              Total pot if called:{' '}
              <span className="font-mono font-semibold text-slate-300">
                {totalPot.toLocaleString()}
              </span>
              <span className="mx-3 text-slate-700">·</span>
              Odds ratio:{' '}
              <span className="font-mono font-semibold text-slate-300">
                {hasValues ? `${odds.toFixed(1)} : 1` : '—'}
              </span>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Required Equity
              </p>
            </div>
            <p className={`font-mono text-5xl font-bold tracking-tight ${equityColor}`}>
              {hasValues ? `${percent.toFixed(1)}%` : '—'}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Your hand must win this often to break even on the call
            </p>

            {hasValues && (
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            If your estimated hand equity exceeds the required equity, this call is{' '}
            <span className="text-emerald-400">+EV</span> in the long run.
          </div>
        </div>
      </div>
    </div>
  );
}
