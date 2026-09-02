import { useState } from 'react';
import type { NavProps, Scheme } from '../types';

interface Props extends NavProps {
  scheme: Scheme;
}

const allDocs = [
  { category: 'Identity & Address', icon: '🪪', docs: [
    { name: 'Aadhaar Card', required: true, status: 'ready' as const, note: 'Self-attested photocopy + original for verification' },
    { name: 'PAN Card', required: true, status: 'missing' as const, note: 'Mandatory for loan amounts above ₹50,000' },
    { name: 'Voter ID / Passport', required: false, status: 'optional' as const, note: 'Any one alternative identity proof' },
  ]},
  { category: 'Income & Category', icon: '📊', docs: [
    { name: 'Income Certificate', required: true, status: 'ready' as const, note: 'Issued by Tahsildar / MRO within 6 months' },
    { name: 'Caste Certificate (SC/ST/OBC)', required: false, status: 'optional' as const, note: 'Required only for reserved category applicants — enables higher subsidy' },
    { name: 'BPL Card', required: false, status: 'optional' as const, note: 'If applicable, enables additional benefits' },
  ]},
  { category: 'Business & Project', icon: '📋', docs: [
    { name: 'Project Report / Business Plan', required: true, status: 'missing' as const, note: 'Detailed report with cost estimates, market analysis, and revenue projections' },
    { name: 'Experience Certificate', required: false, status: 'optional' as const, note: 'Strengthens your application — not mandatory' },
    { name: 'Shop / Business Registration', required: false, status: 'optional' as const, note: 'If existing business — Udyam registration preferred' },
  ]},
  { category: 'Banking', icon: '🏦', docs: [
    { name: 'Bank Account (6 months statement)', required: true, status: 'missing' as const, note: 'Savings account in your name with at least 6 months history' },
    { name: 'Cancelled Cheque', required: true, status: 'ready' as const, note: 'For NEFT/RTGS linking of subsidy' },
  ]},
  { category: 'Educational', icon: '🎓', docs: [
    { name: 'Educational Certificate (Class 8+)', required: true, status: 'missing' as const, note: 'Required for projects above ₹10 Lakh' },
    { name: 'Skill/Vocational Certificate', required: false, status: 'optional' as const, note: 'Demonstrates business expertise — strengthens application' },
  ]},
  { category: 'Photos', icon: '📸', docs: [
    { name: 'Passport-size Photographs', required: true, status: 'ready' as const, note: '3–4 recent colour photographs, white background' },
  ]},
];

export default function RequiredDocuments({ navigate, scheme }: Props) {
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set(['Aadhaar Card', 'Income Certificate', 'Cancelled Cheque', 'Passport-size Photographs']));
  const toggle = (name: string) => setCheckedDocs(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const totalRequired = allDocs.flatMap(c => c.docs).filter(d => d.required).length;
  const checkedRequired = allDocs.flatMap(c => c.docs).filter(d => d.required && checkedDocs.has(d.name)).length;
  const progress = Math.round(checkedRequired / totalRequired * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate('scheme-details', scheme.id)} className="hover:text-white transition-colors">Scheme Details</button>
        <span>/</span>
        <span className="text-slate-300">Documents</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Required Documents</h1>
          <p className="text-slate-400 text-sm">Personalized checklist for {scheme.name}</p>
        </div>
        <div className="flex-shrink-0 bg-[#0f1f3d] border border-white/8 rounded-2xl px-5 py-3 text-center">
          <p className="text-3xl font-bold text-white mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{progress}%</p>
          <p className="text-xs text-slate-500">ready ({checkedRequired}/{totalRequired})</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Document readiness</span>
          <span>{checkedRequired} of {totalRequired} mandatory documents ready</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {progress < 100 && <p className="text-xs text-amber-400 mt-2">⚠ Collect {totalRequired - checkedRequired} more mandatory documents before applying.</p>}
        {progress === 100 && <p className="text-xs text-emerald-400 mt-2">✓ All mandatory documents ready! You can proceed to apply.</p>}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[['text-red-400', '● Mandatory'], ['text-amber-400', '○ Optional'], ['text-emerald-400', '✓ Ready']].map(([color, label]) => (
          <span key={label} className={`text-xs ${color} flex items-center gap-1`}>{label}</span>
        ))}
      </div>

      {/* Document categories */}
      <div className="space-y-5">
        {allDocs.map(({ category, icon, docs }) => (
          <div key={category} className="bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/2">
              <span className="text-xl">{icon}</span>
              <h2 className="text-white font-semibold text-sm">{category}</h2>
              <span className="ml-auto text-xs text-slate-500">{docs.filter(d => d.required).length} required</span>
            </div>
            <div className="p-4 space-y-3">
              {docs.map(({ name, required, status, note }) => {
                const isChecked = checkedDocs.has(name);
                return (
                  <div key={name} className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-emerald-400/5 border border-emerald-500/15' : 'hover:bg-white/3 border border-transparent'}`} onClick={() => toggle(name)}>
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                      {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${isChecked ? 'text-white line-through text-slate-400' : 'text-white'}`}>{name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${required ? 'text-red-400 bg-red-400/10' : 'text-slate-500 bg-white/5'}`}>{required ? 'Required' : 'Optional'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button className="text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl transition-colors">Download Checklist PDF</button>
        <button onClick={() => navigate('partners')} className="flex-1 text-sm bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-semibold transition-colors">Find Nearest Partner →</button>
      </div>
    </div>
  );
}
