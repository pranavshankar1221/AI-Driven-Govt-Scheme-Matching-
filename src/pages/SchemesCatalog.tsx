import { useState } from 'react';
import type { NavProps } from '../types';
import { schemes } from '../data/schemes';

const types = ['All', 'Business Loan', 'Housing Loan Subsidy', 'Skill Development + Loan', 'Working Capital Loan', 'Craft Development'];
const categories = ['All', 'General', 'SC', 'ST', 'OBC', 'Women', 'EWS', 'BPL', 'Street Vendors', 'Weavers'];

export default function SchemesCatalog({ navigate }: NavProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');

  const filtered = schemes.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.purpose.toLowerCase().includes(search.toLowerCase()) || s.organization.toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All' || s.type === type;
    const matchCategory = category === 'All' || s.categories.includes(category);
    return matchSearch && matchType && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
          <span>/</span>
          <span className="text-white">Schemes Catalog</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Government Schemes</h1>
        <p className="text-slate-400">Browse and filter {schemes.length}+ central government welfare and financial assistance schemes.</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes by name, purpose, or ministry…"
            className="w-full bg-[#0f1f3d] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <p className="text-xs text-slate-500 mb-1.5">Scheme Type</p>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${type === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">Showing <span className="text-white font-semibold">{filtered.length}</span> schemes</p>
        <button onClick={() => navigate('ai-matcher')} className="flex items-center gap-2 text-sm bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Use AI Matcher
        </button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(scheme => (
          <div key={scheme.id} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 flex flex-col hover:border-blue-500/30 transition-all group hover:-translate-y-0.5">
            <div className="flex items-start gap-2 mb-3 flex-wrap">
              {scheme.badge && <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{scheme.badge}</span>}
              <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{scheme.type}</span>
            </div>

            <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 group-hover:text-blue-300 transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{scheme.name}</h3>
            <p className="text-xs text-slate-500 mb-2">{scheme.organization}</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3 flex-1 line-clamp-2">{scheme.purpose}</p>

            <div className="bg-[#132040] rounded-xl p-3 mb-3">
              <p className="text-xs text-slate-500 mb-1">Financial Assistance</p>
              <p className="text-sm text-amber-400 font-medium leading-snug">{scheme.financialAssistance}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Age {scheme.minAge}–{scheme.maxAge}
              </div>
              {scheme.maxIncome > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Income &lt;₹{(scheme.maxIncome / 100000).toFixed(0)}L
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {scheme.categories.slice(0, 4).map(c => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{c}</span>
              ))}
              {scheme.categories.length > 4 && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500">+{scheme.categories.length - 4}</span>}
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={() => navigate('scheme-details', scheme.id)} className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors">View Details</button>
              <button onClick={() => navigate('eligibility', scheme.id)} className="flex-1 text-xs border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-2 rounded-lg transition-colors">Check Eligibility</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-slate-400 text-lg mb-2">No schemes match your filters</p>
          <p className="text-slate-500 text-sm mb-4">Try adjusting your search or use the AI Matcher for personalized results.</p>
          <button onClick={() => navigate('ai-matcher')} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">Use AI Matcher</button>
        </div>
      )}
    </div>
  );
}
