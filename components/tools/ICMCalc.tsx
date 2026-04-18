'use client';

import { useState } from 'react';
import { calculateICM } from '@/lib/calculators/icm';
import { Plus, Trash2 } from 'lucide-react';

export function ICMCalc() {
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        {/* Stacks Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-200">Player Stacks</h3>
            <button
              onClick={() => setStacks([...stacks, 1000])}
              className="flex items-center text-sm text-emerald-500 hover:text-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Player
            </button>
          </div>
          <div className="space-y-3">
            {stacks.map((stack, i) => (
              <div key={`stack-${i}`} className="flex items-center gap-3">
                <span className="w-6 text-sm text-slate-500">P{i + 1}</span>
                <input
                  type="number"
                  min="0"
                  value={stack || ''}
                  onChange={(e) => updateStack(i, Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setStacks(stacks.filter((_, idx) => idx !== i))}
                  disabled={stacks.length <= 2}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                  aria-label="Remove player"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Payouts Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-200">Payout Structure ($)</h3>
            <button
              onClick={() => setPayouts([...payouts, 100])}
              className="flex items-center text-sm text-emerald-500 hover:text-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Prize
            </button>
          </div>
          <div className="space-y-3">
            {payouts.map((prize, i) => (
              <div key={`prize-${i}`} className="flex items-center gap-3">
                <span className="w-12 text-sm text-slate-500">{i + 1}st</span>
                <input
                  type="number"
                  min="0"
                  value={prize || ''}
                  onChange={(e) => updatePayout(i, Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setPayouts(payouts.filter((_, idx) => idx !== i))}
                  disabled={payouts.length <= 1}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                  aria-label="Remove prize"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Output */}
      <div className="rounded-2xl border border-emerald-900/50 bg-slate-900/50 p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-medium text-emerald-400">ICM Model Results</h3>

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-800/50 p-4 text-sm text-slate-400">
          <div>
            Total Chips In Play:{' '}
            <span className="font-semibold text-white">{totalChips.toLocaleString()}</span>
          </div>
          <div>
            Remaining Prizepool:{' '}
            <span className="font-semibold text-white">${totalPrize.toLocaleString()}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Chips</th>
                <th className="px-4 py-3 font-medium text-right">Real Value (ICM)</th>
                <th className="px-4 py-3 font-medium text-right">% of Pool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stacks.map((stack, i) => {
                const icmValue = results[i] || 0;
                const poolPct = totalPrize > 0 ? (icmValue / totalPrize) * 100 : 0;
                return (
                  <tr
                    key={`res-${i}`}
                    className="text-slate-300 transition-colors hover:bg-slate-800/20"
                  >
                    <td className="px-4 py-3">Player {i + 1}</td>
                    <td className="px-4 py-3 font-mono">{stack.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      $
                      {icmValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{poolPct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
