import React from 'react';
import { PieChart, ShieldAlert, ShieldCheck, Users, Target, Activity } from 'lucide-react';
import { CLUSTERING_DATA } from '../data/pipelineData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';

export const ClusteringTab: React.FC = () => {
  const clusterProfiles = CLUSTERING_DATA || [
    { ClusterID: 0, ProfileName: "Cluster A: Low-Risk Prime Borrowers", BorrowerCount: 15550, BorrowerPercentage: 31.1, DefaultRate_Pct: 2.1, AvgCreditScore: 765, AvgIncome: 98400, AvgDTIRatio: 0.28, RiskTier: "Low Risk" },
    { ClusterID: 1, ProfileName: "Cluster B: Moderate-Risk Standard Borrowers", BorrowerCount: 21200, BorrowerPercentage: 42.4, DefaultRate_Pct: 10.4, AvgCreditScore: 670, AvgIncome: 62100, AvgDTIRatio: 0.41, RiskTier: "Moderate Risk" },
    { ClusterID: 2, ProfileName: "Cluster C: High-Risk Vulnerable Borrowers", BorrowerCount: 13250, BorrowerPercentage: 26.5, DefaultRate_Pct: 24.8, AvgCreditScore: 545, AvgIncome: 34200, AvgDTIRatio: 0.61, RiskTier: "High Risk" },
  ];

  const pieData = clusterProfiles.map((c: any) => ({
    name: c.ProfileName.split(':')[0],
    value: c.BorrowerCount,
    color: c.RiskTier === 'High Risk' ? '#f43f5e' : c.RiskTier === 'Moderate Risk' ? '#f59e0b' : '#10b981',
  }));

  const barData = clusterProfiles.map((c: any) => ({
    name: c.ProfileName.split(':')[0],
    defaultRate: c.DefaultRate_Pct,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden shadow-2xl glow-purple">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-400 p-0.5 shadow-xl shadow-purple-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[12px] flex items-center justify-center text-purple-400">
                <Target className="w-7 h-7" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-400 text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Unsupervised Borrower Segmentation</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white">K-Means Cluster Profiling (Optimal K=3)</h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                Partitioned 50,000 borrowers into 3 distinct credit risk profiles based on Income, Credit Score, Loan Amount, and DTI Ratio.
              </p>
            </div>
          </div>

          <div className="glass-card px-5 py-3 rounded-2xl border border-purple-500/30 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Optimal K Selection</div>
            <div className="text-xl font-black text-purple-400">K = 3 (Elbow Method)</div>
          </div>
        </div>
      </div>

      {/* Cluster Profiles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clusterProfiles.map((c: any, idx: number) => {
          const isHigh = c.RiskTier === 'High Risk';
          const isMod = c.RiskTier === 'Moderate Risk';

          const cardBorder = isHigh ? 'border-rose-500/40 glow-rose' : isMod ? 'border-amber-500/40' : 'border-emerald-500/40 glow-emerald';
          const badgeBg = isHigh ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : isMod ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

          return (
            <div key={idx} className={`glass-card p-6 rounded-2xl glass-card-hover border relative ${cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">Cluster ID: #{c.ClusterID}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badgeBg}`}>
                  {c.RiskTier}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white mb-4 leading-tight">{c.ProfileName}</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">Segment Share:</span>
                  <span className="font-bold text-white">{c.BorrowerCount.toLocaleString()} ({c.BorrowerPercentage}%)</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">Default Tendency:</span>
                  <span className={`font-black text-sm ${isHigh ? 'text-rose-400' : isMod ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {c.DefaultRate_Pct}% Default Rate
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">Avg Credit Score:</span>
                  <span className="font-bold text-white">{c.AvgCreditScore} / 850</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">Avg Annual Income:</span>
                  <span className="font-bold text-white">${c.AvgIncome.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Avg DTI Ratio:</span>
                  <span className="font-bold text-white">{(c.AvgDTIRatio * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Segmentation Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Share per cluster */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            <span>Borrower Segment Share (%)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of borrowers across the 3 K-Means clusters.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Default rate per cluster */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <Users className="w-5 h-5 text-rose-400" />
            <span>Segment Default Concentration (%)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Cluster C (Subprime) accounts for the vast majority of financial loss.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: number) => [`${val}%`, 'Default Rate']}
                />
                <Bar dataKey="defaultRate" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
