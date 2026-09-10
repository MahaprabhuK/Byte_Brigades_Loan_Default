import React, { useState } from 'react';
import { Users, DollarSign, AlertTriangle, CreditCard, TrendingUp, CheckCircle2, ShieldAlert, Sparkles, Search, Layers, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const OverviewTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const targetData = [
    { name: 'No Default (Class 0)', value: 44195, color: '#10b981' },
    { name: 'Default (Class 1)', value: 5805, color: '#f43f5e' },
  ];

  const purposeData = [
    { purpose: 'Auto', count: 10120, fill: '#3b82f6' },
    { purpose: 'Business', count: 9850, fill: '#8b5cf6' },
    { purpose: 'Education', count: 10040, fill: '#06b6d4' },
    { purpose: 'Home', count: 9980, fill: '#10b981' },
    { purpose: 'Other', count: 10010, fill: '#f59e0b' },
  ];

  const sampleRows = [
    { id: 'LN-10001', age: 34, income: '$65,000', loan: '$120,000', credit: 720, dti: '0.38', purpose: 'Home', status: 'No Default', riskTier: 'Low Risk' },
    { id: 'LN-10002', age: 28, income: '$32,000', loan: '$85,000', credit: 580, dti: '0.62', purpose: 'Auto', status: 'Default', riskTier: 'Critical Risk' },
    { id: 'LN-10003', age: 45, income: '$110,000', loan: '$250,000', credit: 790, dti: '0.24', purpose: 'Business', status: 'No Default', riskTier: 'Low Risk' },
    { id: 'LN-10004', age: 31, income: '$42,000', loan: '$95,000', credit: 610, dti: '0.54', purpose: 'Education', status: 'Default', riskTier: 'High Risk' },
    { id: 'LN-10005', age: 52, income: '$88,000', loan: '$140,000', credit: 740, dti: '0.31', purpose: 'Home', status: 'No Default', riskTier: 'Low Risk' },
    { id: 'LN-10006', age: 39, income: '$55,000', loan: '$115,000', credit: 660, dti: '0.41', purpose: 'Auto', status: 'No Default', riskTier: 'Moderate Risk' },
    { id: 'LN-10007', age: 26, income: '$38,000', loan: '$78,000', credit: 590, dti: '0.59', purpose: 'Other', status: 'Default', riskTier: 'Critical Risk' },
  ];

  const filteredRows = sampleRows.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-blue-500/25 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Risk Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Loan Default Intelligence & Risk Infrastructure
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Enterprise Data Warehousing (Star Schema DDL), multi-dimensional OLAP analytics, K-Means borrower segmentation, Apriori rule mining, and Gradient Boosting continuous predictive scoring.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="glass-card px-4 py-3 rounded-2xl border border-slate-700/60 flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Telemetry</div>
                <div className="text-xs font-bold text-emerald-400">50,000 Records Loaded</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-5 rounded-2xl glass-card-hover border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition"></div>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Borrowers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">50,000</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Cleaned Payload</span>
            </span>
            <span className="text-slate-500">18 Attributes</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full w-full rounded-full"></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 rounded-2xl glass-card-hover border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition"></div>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Portfolio Volume</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">$6.29B</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Avg Loan: $125,780</span>
            <span className="text-emerald-400 font-bold">+4.2% YoY</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-3/4 rounded-full"></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 rounded-2xl glass-card-hover border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition"></div>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Count & Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">5,805 <span className="text-lg font-bold text-rose-300/80">(11.61%)</span></div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-rose-400 font-semibold flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Imbalanced Class Target</span>
            </span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full w-[11.6%] rounded-full"></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-5 rounded-2xl glass-card-hover border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition"></div>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Credit Profile</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">674 <span className="text-sm text-slate-400 font-normal">/ 850</span></div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-300">Avg DTI: <strong>0.41 (41%)</strong></span>
            <span className="text-purple-400 font-semibold">Prime / Near-Prime</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full w-2/3 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Pie Chart: Target Distribution (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Target Class Ratio (Default vs Non-Default)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">Stratified 80/20 train/test distribution across 50,000 records.</p>

            <div className="h-64 w-full relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">50,000</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Loans</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0"></span>
              <div>
                <div className="text-slate-400 font-medium">No Default (0)</div>
                <div className="text-sm font-extrabold text-emerald-400">44,195 (88.39%)</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0"></span>
              <div>
                <div className="text-slate-400 font-medium">Default (1)</div>
                <div className="text-sm font-extrabold text-rose-400">5,805 (11.61%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Loan Purpose Breakdown (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span>Retail Credit Volume by Loan Purpose</span>
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                5 Retail Categories
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Evenly weighted distribution across Auto, Business, Education, Home, and Other credit lines.</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purposeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="purpose" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Minimum per Purpose: <strong>9,850 loans</strong></span>
            <span>Maximum per Purpose: <strong>10,120 loans</strong></span>
          </div>
        </div>
      </div>

      {/* Data Warehouse Fact Table Preview */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Data Warehouse Star Schema Fact Payload Preview</span>
            </h3>
            <p className="text-xs text-slate-400">Live preview of records loaded from <code className="text-purple-400">data_warehouse/loan_dw.db</code></p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Loan ID, Purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Loan ID</th>
                <th className="py-3 px-3">Age</th>
                <th className="py-3 px-3">Annual Income</th>
                <th className="py-3 px-3">Loan Amount</th>
                <th className="py-3 px-3">Credit Score</th>
                <th className="py-3 px-3">DTI Ratio</th>
                <th className="py-3 px-3">Purpose</th>
                <th className="py-3 px-3">Risk Category</th>
                <th className="py-3 px-3">Default Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/70 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-400">{row.id}</td>
                  <td className="py-3 px-3">{row.age} yrs</td>
                  <td className="py-3 px-3 font-medium">{row.income}</td>
                  <td className="py-3 px-3 font-medium">{row.loan}</td>
                  <td className="py-3 px-3 font-bold text-white">{row.credit}</td>
                  <td className="py-3 px-3">{row.dti}</td>
                  <td className="py-3 px-3">{row.purpose}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      row.riskTier === 'Low Risk' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      row.riskTier === 'Moderate Risk' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                      row.riskTier === 'High Risk' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {row.riskTier}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      row.status === 'Default'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    }`}>
                      {row.status}
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
