import { useState } from 'react';
import type { NavProps } from '../types';
import type { MatchedSchemeResult } from '../types/api';
import { schemeService } from '../services/schemeService';

type Step = 'form' | 'matching' | 'results';

const matchingSteps = [
  'Understanding your requirement…',
  'Checking eligibility criteria…',
  'Finding suitable schemes…',
  'Calculating financial fit…',
  'Ranking by best match…',
];

export default function AIMatcher({ navigate }: NavProps) {
  const [step, setStep] = useState<Step>('form');
  const [matchStep, setMatchStep] = useState(0);
  const [form, setForm] = useState({ purpose: '', location: 'urban', age: '', income: '', category: 'General', business: '', amount: '' });
  const [matches, setMatches] = useState<MatchedSchemeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startMatching = async () => {
    setStep('matching');
    setMatchStep(0);
    setError(null);

    const stepTimer = setInterval(() => {
      setMatchStep(prev => (prev < matchingSteps.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await schemeService.matchSchemes({
        purpose: form.purpose || 'Tailoring Business',
        location: form.location,
        category: form.category,
        income: form.income,
        age: form.age ? Number(form.age) : undefined,
        business: form.business,
        amount: form.amount,
      });

      clearInterval(stepTimer);
      setMatches(res.matches || []);
      setStep('results');
    } catch (err) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Backend matching service unavailable.');
      setStep('form');
    }
  };

  if (step === 'matching') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI is working…</h2>
          <div className="space-y-2 text-left">
            {matchingSteps.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${i <= matchStep ? 'bg-blue-600/10 border border-blue-500/20' : 'opacity-40'}`}>
                {i < matchStep ? (
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : i === matchStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= matchStep ? 'text-slate-200' : 'text-slate-500'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setStep('form')} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your Scheme Matches</h1>
            <p className="text-slate-400 text-sm">Based on your profile · {matches.length} schemes found</p>
          </div>
        </div>

        {/* Profile summary */}
        <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 mb-6 flex flex-wrap gap-3">
          {[
            { label: 'Purpose', value: form.purpose || 'Tailoring Business' },
            { label: 'Location', value: form.location === 'urban' ? 'Urban' : 'Rural' },
            { label: 'Category', value: form.category },
            { label: 'Amount', value: form.amount ? `₹${form.amount}` : 'Not specified' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 bg-[#132040] px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-500">{label}:</span>
              <span className="text-xs text-white font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Results */}
        {matches.length === 0 ? (
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-8 text-center text-slate-400">
            <p className="text-base mb-2">No matching schemes returned by the backend.</p>
            <button onClick={() => setStep('form')} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl">
              Refine Search Parameters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((scheme, i) => (
              <div key={scheme.id} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 sm:p-6 hover:border-blue-500/30 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {i === 0 && <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">Best Match</span>}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${scheme.eligibility === 'Eligible' ? 'bg-emerald-400/15 text-emerald-400' : scheme.eligibility === 'Likely Eligible' ? 'bg-blue-400/15 text-blue-400' : 'bg-amber-400/15 text-amber-400'}`}>{scheme.eligibility}</span>
                      <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{scheme.type}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{scheme.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{scheme.organization}</p>
                    <div className="bg-[#132040] rounded-xl p-3 mb-3">
                      <p className="text-xs text-slate-500 mb-1">Why it matches</p>
                      <p className="text-sm text-slate-200">{scheme.why}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-amber-400 text-sm font-medium">{scheme.financialAssistance}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 sm:items-end">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke={i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#f59e0b'} strokeWidth="6" strokeDasharray={`${2 * Math.PI * 34 * scheme.match / 100} ${2 * Math.PI * 34 * (1 - scheme.match / 100)}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{scheme.match}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">match score</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                  <button onClick={() => navigate('scheme-details', scheme.id)} className="flex-1 min-w-24 text-sm bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium transition-colors text-center">View Scheme</button>
                  <button onClick={() => navigate('eligibility', scheme.id)} className="flex-1 min-w-24 text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-2.5 rounded-xl transition-colors text-center">Check Eligibility</button>
                  <button onClick={() => navigate('calculator', scheme.id)} className="flex-1 min-w-24 text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-2.5 rounded-xl transition-colors text-center">Calculate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => setStep('form')} className="text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl transition-colors">Refine Search</button>
          <button onClick={() => navigate('partners')} className="text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 px-5 py-2.5 rounded-xl font-medium transition-colors">Find Nearby Partner</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-4 text-3xl">🤖</div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI Matcher</h1>
        <p className="text-slate-400">Share your profile and our AI will find the best-matching government schemes for you.</p>
      </div>

      <div className="bg-[#0f1f3d] border border-white/8 rounded-3xl p-6 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-xs text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">!</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white text-xs px-1">✕</button>
          </div>
        )}
        <div>
          <label className="text-sm text-slate-300 font-medium block mb-2">What do you want to do?</label>
          <input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Start a tailoring business, get a home loan…" className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 font-medium block mb-2">Age</label>
            <input value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="e.g. 28" type="number" className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-sm text-slate-300 font-medium block mb-2">Location Type</label>
            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-colors">
              <option value="urban">Urban</option>
              <option value="rural">Rural</option>
              <option value="semi-urban">Semi-Urban</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 font-medium block mb-2">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-colors">
              {['General', 'SC', 'ST', 'OBC', 'EWS', 'Minorities', 'Women', 'Ex-Servicemen'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300 font-medium block mb-2">Annual Income (₹)</label>
            <input value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} placeholder="e.g. 2,40,000" className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300 font-medium block mb-2">Loan/Assistance Amount Needed (₹)</label>
          <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 3,00,000" className="w-full bg-[#132040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
        </div>

        <div>
          <label className="text-sm text-slate-300 font-medium block mb-2">Business / Purpose Type</label>
          <div className="flex flex-wrap gap-2">
            {['Tailoring / Garments', 'Food Processing', 'Beauty / Salon', 'Repair Services', 'Housing', 'Agriculture', 'Street Vending', 'Other'].map(b => (
              <button key={b} onClick={() => setForm({ ...form, business: b })} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.business === b ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>{b}</button>
            ))}
          </div>
        </div>

        <button onClick={startMatching} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Find Matching Schemes
        </button>
      </div>
    </div>
  );
}
