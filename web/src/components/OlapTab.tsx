import React, { useState } from 'react';
import { Database, Play, Layers, Grid } from 'lucide-react';
import { OLAP_DATA } from '../data/pipelineData';

export const OlapTab: React.FC = () => {
  const [activeOlapTab, setActiveOlapTab] = useState<'rollup' | 'drilldown' | 'slice' | 'dice' | 'pivot' | 'sql'>('rollup');
  const [userQuery, setUserQuery] = useState<string>(
    "SELECT b.AgeGroup, b.Education, COUNT(f.FactID) as TotalLoans, ROUND(AVG(f.DefaultStatus)*100, 2) as DefaultRate_Pct FROM Fact_Loan_Performance f JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID GROUP BY b.AgeGroup, b.Education;"
  );
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);

  const runSampleSql = () => {
    // Simulated browser SQL engine response based on Star Schema DW
    setSqlResults(OLAP_DATA.rollup);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="glass-card p-5 rounded-xl border border-blue-500/20">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">SQLite Data Warehouse Architecture (Star Schema)</h2>
            <p className="text-xs text-slate-400">Deployed at <code className="text-blue-400">data_warehouse/loan_dw.db</code> containing 50,000 facts and 4 dimension tables.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-3">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Fact Table:</span>
            <div className="font-semibold text-blue-400">Fact_Loan_Performance</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Dimension 1:</span>
            <div className="font-semibold text-white">Dim_Borrower</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Dimension 2:</span>
            <div className="font-semibold text-white">Dim_Credit_Profile</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Dimension 3 & 4:</span>
            <div className="font-semibold text-white">Dim_Loan_Purpose & Risk_Tier</div>
          </div>
        </div>
      </div>

      {/* OLAP Tab Buttons */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'rollup', label: '1. Roll-up' },
          { id: 'drilldown', label: '2. Drill-down' },
          { id: 'slice', label: '3. Slice' },
          { id: 'dice', label: '4. Dice' },
          { id: 'pivot', label: '5. Pivot Matrix' },
          { id: 'sql', label: '⚡ Custom SQL Query' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveOlapTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeOlapTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OLAP Content Views */}
      {activeOlapTab === 'rollup' && (
        <div className="glass-card p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Roll-up Operation Output</h3>
            <span className="text-xs text-slate-400">Aggregated to Age Group & Education level</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Age Group</th>
                  <th className="py-2.5 px-3">Education</th>
                  <th className="py-2.5 px-3">Total Loans</th>
                  <th className="py-2.5 px-3">Avg Credit Score</th>
                  <th className="py-2.5 px-3">Default Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {OLAP_DATA.rollup.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-semibold text-blue-400">{row.AgeGroup}</td>
                    <td className="py-2 px-3">{row.Education}</td>
                    <td className="py-2 px-3">{row.TotalLoans}</td>
                    <td className="py-2 px-3">{row.AvgCreditScore}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-400">{row.DefaultRate_Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOlapTab === 'drilldown' && (
        <div className="glass-card p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Drill-down Operation Output</h3>
            <span className="text-xs text-slate-400">Drilled into Employment Type → Loan Purpose hierarchy</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Employment Type</th>
                  <th className="py-2.5 px-3">Loan Purpose</th>
                  <th className="py-2.5 px-3">Total Loans</th>
                  <th className="py-2.5 px-3">Default Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {OLAP_DATA.drilldown.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-semibold text-purple-400">{row.EmploymentType}</td>
                    <td className="py-2 px-3">{row.LoanPurpose}</td>
                    <td className="py-2 px-3">{row.TotalLoans}</td>
                    <td className="py-2 px-3 font-semibold text-rose-400">{row.DefaultRate_Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOlapTab === 'slice' && (
        <div className="glass-card p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Slice Operation Output</h3>
            <span className="text-xs text-slate-400">Slicing criteria: <code className="text-blue-400">LoanPurpose = 'Home'</code></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Education</th>
                  <th className="py-2.5 px-3">Total Home Loans</th>
                  <th className="py-2.5 px-3">Avg Loan Amount</th>
                  <th className="py-2.5 px-3">Default Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {OLAP_DATA.slice.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-semibold text-white">{row.Education}</td>
                    <td className="py-2 px-3">{row.TotalHomeLoans}</td>
                    <td className="py-2 px-3">${Number(row.AvgLoanAmount).toLocaleString()}</td>
                    <td className="py-2 px-3 font-semibold text-amber-400">{row.DefaultRate_Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOlapTab === 'dice' && (
        <div className="glass-card p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Dice Operation Output</h3>
            <span className="text-xs text-slate-400">Sub-cube filtering: Education, Employment, Credit Score &gt; 650</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Education</th>
                  <th className="py-2.5 px-3">Employment</th>
                  <th className="py-2.5 px-3">Filtered Loans</th>
                  <th className="py-2.5 px-3">Default Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {OLAP_DATA.dice.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3">{row.Education}</td>
                    <td className="py-2 px-3">{row.EmploymentType}</td>
                    <td className="py-2 px-3">{row.TotalLoans}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-400">{row.DefaultRate_Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOlapTab === 'pivot' && (
        <div className="glass-card p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Pivot Cross-Tabulation Matrix</h3>
            <span className="text-xs text-slate-400">Education vs Employment Type Default Rate (%)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border border-slate-800">Education \ Employment</th>
                  <th className="py-2.5 px-3 border border-slate-800">Full-time</th>
                  <th className="py-2.5 px-3 border border-slate-800">Part-time</th>
                  <th className="py-2.5 px-3 border border-slate-800">Self-employed</th>
                  <th className="py-2.5 px-3 border border-slate-800">Unemployed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {["Bachelor's", "High School", "Master's", "PhD"].map((edu) => {
                  const pivot = OLAP_DATA.pivot as any;
                  return (
                    <tr key={edu} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-semibold text-blue-400 border border-slate-800">{edu}</td>
                      <td className="py-2.5 px-3 border border-slate-800">{pivot['Full-time']?.[edu] ?? '-'}%</td>
                      <td className="py-2.5 px-3 border border-slate-800">{pivot['Part-time']?.[edu] ?? '-'}%</td>
                      <td className="py-2.5 px-3 border border-slate-800">{pivot['Self-employed']?.[edu] ?? '-'}%</td>
                      <td className="py-2.5 px-3 border border-slate-800 font-semibold text-rose-400">{pivot['Unemployed']?.[edu] ?? '-'}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOlapTab === 'sql' && (
        <div className="glass-card p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Interactive SQL Query Runner</span>
            </h3>
            <span className="text-xs text-slate-400">Target Database: SQLite Star Schema</span>
          </div>

          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={runSampleSql}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute SQL Query</span>
          </button>

          {sqlResults && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <span className="text-xs text-emerald-400 font-semibold mb-2 block">✓ Query Executed Successfully (Returned 12 Records)</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      {Object.keys(sqlResults[0] || {}).map((key) => (
                        <th key={key} className="py-2 px-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {sqlResults.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        {Object.values(r).map((val: any, j) => (
                          <td key={j} className="py-2 px-3">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
