import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, Sparkles, Sliders, Activity } from 'lucide-react';
import { BorrowerInput, computeDefaultRisk, PredictionResult } from '../utils/predictorEngine';

export const PredictorTab: React.FC = () => {
  const defaultPayload: BorrowerInput = {
    age: 34,
    income: 45000,
    loanAmount: 120000,
    creditScore: 620,
    monthsEmployed: 24,
    numCreditLines: 3,
    interestRate: 14.5,
    loanTerm: 36,
    dtiRatio: 0.42,
    education: "Bachelor's",
    employmentType: "Full-time",
    maritalStatus: "Single",
    hasMortgage: "No",
    hasDependents: "No",
    loanPurpose: "Auto",
    hasCoSigner: "No",
  };

  const [formData, setFormData] = useState<BorrowerInput>(defaultPayload);
  const [result, setResult] = useState<PredictionResult | null>(computeDefaultRisk(defaultPayload));

  const updateField = (key: keyof BorrowerInput, val: any) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    setResult(computeDefaultRisk(updated));
  };

  const applyPreset = (preset: 'prime' | 'subprime' | 'moderate') => {
    let p: BorrowerInput;
    if (preset === 'prime') {
      p = {
        ...defaultPayload,
        income: 115000,
        loanAmount: 140000,
        creditScore: 780,
        dtiRatio: 0.22,
        interestRate: 6.5,
        employmentType: "Full-time",
        monthsEmployed: 72,
        hasCoSigner: "Yes",
      };
    } else if (preset === 'subprime') {
      p = {
        ...defaultPayload,
        income: 28000,
        loanAmount: 110000,
        creditScore: 540,
        dtiRatio: 0.65,
        interestRate: 22.5,
        employmentType: "Part-time",
        monthsEmployed: 12,
        hasCoSigner: "No",
      };
    } else {
      p = defaultPayload;
    }
    setFormData(p);
    setResult(computeDefaultRisk(p));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-yellow-500/30 relative overflow-hidden shadow-2xl glow-purple">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-yellow-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-yellow-400 text-xs font-extrabold uppercase tracking-widest">
              <Zap className="w-4 h-4" />
              <span>Gradient Boosting Probabilistic Model</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">Real-Time Risk Scoring Engine</h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Simulate loan default probability P(Default=1), assign automated risk classification badges, and identify critical risk factors.
            </p>
          </div>

          {/* Presets Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('prime')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition"
            >
              Prime Borrower Preset
            </button>
            <button
              onClick={() => applyPreset('moderate')}
              className="px-3.5 py-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 text-xs font-bold transition"
            >
              Standard Preset
            </button>
            <button
              onClick={() => applyPreset('subprime')}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition"
            >
              Subprime Preset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Borrower Payload Inputs Form (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl space-y-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Financial Payload Controls</span>
            </h3>
            <span className="text-xs text-slate-400">Drag sliders to adjust values</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Income Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Annual Income ($)</span>
                <span className="text-blue-400 font-extrabold text-sm">${formData.income.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={15000}
                max={300000}
                step={5000}
                value={formData.income}
                onChange={(e) => updateField('income', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Loan Amount Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Loan Amount ($)</span>
                <span className="text-blue-400 font-extrabold text-sm">${formData.loanAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={formData.loanAmount}
                onChange={(e) => updateField('loanAmount', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Credit Score Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Credit Score (300-850)</span>
                <span className={`font-extrabold text-sm ${formData.creditScore < 600 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formData.creditScore}
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={850}
                step={5}
                value={formData.creditScore}
                onChange={(e) => updateField('creditScore', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* DTI Ratio Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>DTI Ratio</span>
                <span className={`font-extrabold text-sm ${formData.dtiRatio > 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(formData.dtiRatio * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.01}
                value={formData.dtiRatio}
                onChange={(e) => updateField('dtiRatio', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Interest Rate (%)</span>
                <span className="text-yellow-400 font-extrabold text-sm">{formData.interestRate.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={30.0}
                step={0.5}
                value={formData.interestRate}
                onChange={(e) => updateField('interestRate', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Employment Months Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Months Employed</span>
                <span className="text-blue-400 font-extrabold text-sm">{formData.monthsEmployed} mos</span>
              </div>
              <input
                type="range"
                min={0}
                max={240}
                step={6}
                value={formData.monthsEmployed}
                onChange={(e) => updateField('monthsEmployed', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Categorical Controls Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-800/80">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Employment Status</label>
              <select
                value={formData.employmentType}
                onChange={(e) => updateField('employmentType', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Education Level</label>
              <select
                value={formData.education}
                onChange={(e) => updateField('education', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="High School">High School</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Co-Signer?</label>
              <select
                value={formData.hasCoSigner}
                onChange={(e) => updateField('hasCoSigner', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prediction Results & Gauge Display (5 cols) */}
        {result && (
          <div className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-5 border border-blue-500/30 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Result</span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md ${result.riskBadgeColor}`}>
                  {result.riskCategory}
                </span>
              </div>

              {/* Gauge Display */}
              <div className="text-center py-6 glass-card rounded-2xl my-4 border border-slate-800 relative overflow-hidden">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Default Risk Probability P(Default=1)</div>
                <div className={`text-5xl font-black ${result.probability >= 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.probabilityPercentage}
                </div>
                <div className="text-xs font-bold text-slate-400 mt-1">
                  Predicted Class: <span className="text-white">{result.predictedLabel}</span>
                </div>

                {/* Animated Arc Progress Bar */}
                <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden mt-4 px-1 flex items-center border border-slate-800">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 shadow-md ${
                      result.probability >= 0.7 ? 'bg-rose-500 glow-rose' :
                      result.probability >= 0.45 ? 'bg-amber-500' :
                      result.probability >= 0.2 ? 'bg-yellow-500' : 'bg-emerald-500 glow-emerald'
                    }`}
                    style={{ width: `${result.probability * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk Factors List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Risk Factors Breakdown ({result.riskFactors.length})</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {result.riskFactors.map((factor, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 flex items-start space-x-2.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
