import React, { useState } from 'react';
import { BarChart3, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const EdaTab: React.FC = () => {
  const [selectedPurpose, setSelectedPurpose] = useState<string>('All');
  const [selectedEmployment, setSelectedEmployment] = useState<string>('All');

  const defaultByPurpose = [
    { purpose: 'Auto', defaultRate: 11.4, loans: 10120 },
    { purpose: 'Business', defaultRate: 12.1, loans: 9850 },
    { purpose: 'Education', defaultRate: 11.8, loans: 10040 },
    { purpose: 'Home', defaultRate: 10.9, loans: 9980 },
    { purpose: 'Other', defaultRate: 11.9, loans: 10010 },
  ];

  const defaultByEmployment = [
    { employment: 'Full-time', defaultRate: 9.8, count: 18500 },
    { employment: 'Part-time', defaultRate: 13.4, count: 12400 },
    { employment: 'Self-employed', defaultRate: 12.2, count: 11200 },
    { employment: 'Unemployed', defaultRate: 15.6, count: 7900 },
  ];

  const filteredPurposeData = selectedPurpose === 'All' 
    ? defaultByPurpose 
    : defaultByPurpose.filter(d => d.purpose === selectedPurpose);

  const filteredEmpData = selectedEmployment === 'All'
    ? defaultByEmployment
    : defaultByEmployment.filter(d => d.employment === selectedEmployment);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-white text-sm font-semibold">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Interactive EDA Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Loan Purpose:</span>
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Purposes</option>
              <option value="Auto">Auto</option>
              <option value="Business">Business</option>
              <option value="Education">Education</option>
              <option value="Home">Home</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Employment:</span>
            <select
              value={selectedEmployment}
              onChange={(e) => setSelectedEmployment(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Unemployed">Unemployed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purpose Default Rate Chart */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Default Rate (%) by Loan Purpose</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Business loans exhibit highest default tendency (~12.1%).</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredPurposeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="purpose" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Default Rate']}
                />
                <Bar dataKey="defaultRate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employment Default Rate Chart */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Default Rate (%) by Employment Type</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Unemployed borrowers experience peak default rates (~15.6%).</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredEmpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="employment" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Default Rate']}
                />
                <Bar dataKey="defaultRate" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Credit Score Distribution Insights
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Non-Defaulter Median Credit Score:</span>
              <span className="font-semibold text-emerald-400">685 / 850</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Defaulter Median Credit Score:</span>
              <span className="font-semibold text-rose-400">592 / 850</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Debt-to-Income (DTI) Insights
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Non-Defaulter Median DTI:</span>
              <span className="font-semibold text-emerald-400">0.37 (37%)</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Defaulter Median DTI:</span>
              <span className="font-semibold text-rose-400">0.58 (58%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
