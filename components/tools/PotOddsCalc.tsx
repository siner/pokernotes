'use client';

import { useState } from 'react';
import { calculatePotOdds, potOddsPercent } from '@/lib/calculators/potOdds';

export function PotOddsCalc() {
  const [potSize, setPotSize] = useState<number | ''>(100);
  const [betToCall, setBetToCall] = useState<number | ''>(50);

  const parsedPotSize = typeof potSize === 'number' ? potSize : 0;
  const parsedBet = typeof betToCall === 'number' ? betToCall : 0;

  const odds = calculatePotOdds(parsedPotSize, parsedBet);
  const percent = potOddsPercent(parsedPotSize, parsedBet);

  // Color coding based on how strict the call is (rough heuristic for UX)
  const getProgressColor = (pct: number) => {
    if (pct === 0) return 'bg-slate-700';
    if (pct < 25) return 'bg-emerald-500';
    if (pct < 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Input Controls */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Current Pot Size
            </label>
            <input
              type="number"
              min="0"
              value={potSize}
              onChange={(e) => setPotSize(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Bet to Call</label>
            <input
              type="number"
              min="0"
              value={betToCall}
              onChange={(e) => setBetToCall(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 50"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col justify-center rounded-xl bg-slate-800/50 p-6">
          <div className="mb-2 text-sm text-slate-400">Required Equity</div>

          <div className="mb-4 text-5xl font-bold tracking-tight text-white">
            {percent > 0 ? percent.toFixed(1) : '0'}%
          </div>

          <div className="mb-6 flex w-full h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-500 ease-out ${getProgressColor(percent)}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>

          <div className="text-sm text-slate-400">
            Expressed as an odds ratio:{' '}
            <strong className="text-slate-200">{odds > 0 ? odds.toFixed(1) : '0'} : 1</strong>
          </div>
          <p className="mt-4 text-xs italic text-slate-500">
            You need to win more than {percent > 0 ? percent.toFixed(1) : '0'}% of the time to make
            this a profitable call in the long run.
          </p>
        </div>
      </div>
    </div>
  );
}
