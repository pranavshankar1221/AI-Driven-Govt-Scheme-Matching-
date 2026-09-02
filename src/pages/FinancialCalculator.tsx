import { useState, useEffect } from 'react';
import type { NavProps, Scheme } from '../types';

interface Props extends NavProps {
  scheme: Scheme;
}

export default function FinancialCalculator({ navigate, scheme }: Props) {
  const [amount, setAmount] = useState(300000);
  const [rate, setRate] = useState(8);
  const [tenure, setTenure] = useState(36);
  const [moratorium, setMoratorium] = useState(6);
  const [subsidyPct, setSubsidyPct] = useState(25);
  const [showResult, setShowResult] = useState(true);

  const subsidy = amount * subsidyPct / 100;
  const loanAmount = amount - subsidy;
  const monthlyRate = rate / 12 / 100;
  const effectiveTenure = tenure - moratorium;
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, effectiveTenure) / (Math.pow(1 + monthlyRate, effectiveTenure) - 1);
  const totalRepayment = emi * effectiveTenure;
  const totalInterest = totalRepayment - loanAmount;

  useEffect(() => { setShowResult(false); const t = setTimeout(() => setShowResult(true), 150); return () => clearTimeout(t); }, [amount, rate, tenure, moratorium, subsidyPct]);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const SliderInput = ({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) => (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        <span className="text-white font-semibold text-sm">{suffix === '₹' ? fmt(value) : `${value}${suffix}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
      />
      <div className="flex justify-between mt-1 text-xs text-slate-600">
        <span>{suffix === '₹' ? fmt(min) : `${min}${suffix}`}</span>
        <span>{suffix === '₹' ? fmt(max) : `${max}${suffix}`}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <span className="text-white">Financial Calculator</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Financial Assistance Calculator</h1>
        <p className="text-slate-400">Calculate your EMI, subsidy, and total repayment for {scheme.name}.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-[#0f1f3d] border border-white/8 rounded-3xl p-6 space-y-6">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Scheme Selected</p>
            <div className="flex items-center gap-3 bg-[#132040] rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-white text-sm font-medium line-clamp-1">{scheme.name}</p>
            </div>
          </div>

          <SliderInput label="Project / Loan Amount" value={amount} min={50000} max={2500000} step={50000} suffix="₹" onChange={setAmount} />
          <SliderInput label="Interest Rate (% per annum)" value={rate} min={5} max={18} step={0.5} suffix="%" onChange={setRate} />
          <SliderInput label="Repayment Tenure" value={tenure} min={12} max={84} suffix=" months" onChange={setTenure} />
          <SliderInput label="Moratorium Period" value={moratorium} min={0} max={18} suffix=" months" onChange={setMoratorium} />

          <div>
            <p className="text-sm text-slate-300 font-medium mb-3">Government Subsidy</p>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 25, 35].map(p => (
                <button key={p} onClick={() => setSubsidyPct(p)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${subsidyPct === p ? 'bg-amber-500 text-white' : 'border border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>
                  {p === 0 ? 'No Subsidy' : `${p}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className={`space-y-4 transition-opacity duration-150 ${showResult ? 'opacity-100' : 'opacity-0'}`}>
          {/* Summary card */}
          <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-3xl p-6">
            <p className="text-blue-200 text-sm mb-1">Monthly EMI</p>
            <p className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{isNaN(emi) ? '—' : fmt(emi)}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Effective Tenure', value: `${effectiveTenure} months` },
                { label: 'Interest Rate', value: `${rate}% p.a.` },
                { label: 'Project Cost', value: fmt(amount) },
                { label: 'Subsidy', value: subsidyPct > 0 ? fmt(subsidy) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-blue-200 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm mb-4">Repayment Breakdown</h3>
            {[
              { label: 'Project Cost', value: fmt(amount), color: 'text-white' },
              { label: `Subsidy (${subsidyPct}%)`, value: subsidyPct > 0 ? `− ${fmt(subsidy)}` : '₹0', color: 'text-emerald-400' },
              { label: 'Net Loan Amount', value: fmt(loanAmount), color: 'text-white', bold: true },
              { label: 'Total Interest', value: isNaN(totalInterest) ? '—' : fmt(totalInterest), color: 'text-amber-400' },
              { label: 'Total Repayment', value: isNaN(totalRepayment) ? '—' : fmt(totalRepayment), color: 'text-white', bold: true },
            ].map(({ label, value, color, bold }) => (
              <div key={label} className={`flex justify-between py-2 ${bold ? 'border-t border-white/8 pt-3' : ''}`}>
                <span className="text-slate-400 text-sm">{label}</span>
                <span className={`font-semibold ${color} ${bold ? 'text-base' : 'text-sm'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Visual bar */}
          {subsidyPct > 0 && (
            <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Cost Distribution</h3>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500" style={{ width: `${subsidyPct}%` }} />
                <div className="bg-blue-600 flex-1" />
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-slate-400">Subsidy {subsidyPct}%</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /><span className="text-xs text-slate-400">Loan {100 - subsidyPct}%</span></div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate('documents', scheme.id)} className="flex-1 text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-3 rounded-xl transition-colors font-medium">View Documents</button>
            <button onClick={() => navigate('partners')} className="flex-1 text-sm bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-colors font-medium">Find Partner</button>
          </div>
        </div>
      </div>
    </div>
  );
}
