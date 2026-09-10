import React, { useState } from 'react';
import { GitMerge, Filter, ArrowRight } from 'lucide-react';
import { ASSOCIATION_RULES_DATA } from '../data/pipelineData';

export const AssociationRulesTab: React.FC = () => {
  const [minLift, setMinLift] = useState<number>(1.0);
  const [minConf, setMinConf] = useState<number>(0.2);

  const rules = ASSOCIATION_RULES_DATA || [];

  const filteredRules = rules.filter(
    (r: any) => r.lift >= minLift && r.confidence >= minConf
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-xl border border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Association Rule Mining (Apriori Algorithm)</h2>
            <p className="text-xs text-slate-400">Extracting non-trivial credit risk patterns with consequent outcome <code className="text-cyan-400">Default:Yes</code>.</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-white text-sm font-semibold">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Rule Mining Filters ({filteredRules.length} Rules Extracted)</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center space-x-3">
            <span>Minimum Lift: <strong className="text-cyan-400">{minLift.toFixed(1)}x</strong></span>
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={minLift}
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="w-28 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-3">
            <span>Minimum Confidence: <strong className="text-cyan-400">{(minConf * 100).toFixed(0)}%</strong></span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={minConf}
              onChange={(e) => setMinConf(parseFloat(e.target.value))}
              className="w-28 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="glass-card p-5 rounded-xl space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Antecedent Condition (If...)</th>
                <th className="py-2.5 px-3">Consequent (Then...)</th>
                <th className="py-2.5 px-3">Support</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Lift Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {filteredRules.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-white max-w-md">{r.antecedents_str}</td>
                  <td className="py-2.5 px-3 flex items-center space-x-1 text-rose-400 font-semibold">
                    <ArrowRight className="w-3 h-3" />
                    <span>{r.consequents_str}</span>
                  </td>
                  <td className="py-2.5 px-3">{(r.support * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-400">{(r.confidence * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                      {r.lift.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
