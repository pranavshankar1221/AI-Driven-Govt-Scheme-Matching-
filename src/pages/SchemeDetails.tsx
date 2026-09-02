import { useState } from 'react';
import type { NavProps, Scheme } from '../types';

interface Props extends NavProps {
  scheme: Scheme;
}

const tabs = ['Overview', 'Eligibility', 'Benefits', 'Documents', 'Process', 'Partners'];

export default function SchemeDetails({ navigate, scheme }: Props) {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate('catalog')} className="hover:text-white transition-colors">Schemes</button>
        <span>/</span>
        <span className="text-slate-300 truncate">{scheme.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-[#0f1f3d] border border-white/10 rounded-3xl p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {scheme.badge && <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">{scheme.badge}</span>}
          <span className="text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">{scheme.type}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{scheme.name}</h1>
        <p className="text-slate-400 mb-6">{scheme.organization}</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">Financial Assistance</p>
            <p className="text-sm text-amber-400 font-semibold leading-snug">{scheme.financialAssistance}</p>
          </div>
          <div className="bg-blue-600/5 border border-blue-500/15 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">Eligible Categories</p>
            <p className="text-sm text-blue-400 font-semibold">{scheme.categories.slice(0, 3).join(', ')}{scheme.categories.length > 3 ? '…' : ''}</p>
          </div>
          <div className="bg-emerald-600/5 border border-emerald-500/15 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">Age Range</p>
            <p className="text-sm text-emerald-400 font-semibold">{scheme.minAge} – {scheme.maxAge} years</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => navigate('eligibility', scheme.id)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Check Eligibility
          </button>
          <button onClick={() => navigate('calculator', scheme.id)} className="flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:border-white/40 text-white text-sm font-medium rounded-xl transition-colors hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Calculate
          </button>
          <button onClick={() => navigate('documents', scheme.id)} className="flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:border-white/40 text-white text-sm font-medium rounded-xl transition-colors hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Documents
          </button>
          <button onClick={() => navigate('partners')} className="flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:border-white/40 text-white text-sm font-medium rounded-xl transition-colors hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Find Partner
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 bg-[#060e1d] rounded-2xl p-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-6">
        {tab === 'Overview' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Scheme Overview</h2>
            <p className="text-slate-300 leading-relaxed mb-6">{scheme.description}</p>
            <div className="bg-[#132040] rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">Eligibility Summary</h3>
              <p className="text-slate-300 text-sm">{scheme.eligibilitySummary}</p>
            </div>
          </div>
        )}

        {tab === 'Eligibility' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Eligibility Criteria</h2>
            <p className="text-slate-400 text-sm mb-4">{scheme.eligibilitySummary}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Minimum Age', value: `${scheme.minAge} years`, icon: '👤' },
                { label: 'Maximum Age', value: `${scheme.maxAge} years`, icon: '📅' },
                { label: 'Income Limit', value: scheme.maxIncome > 0 ? `₹${(scheme.maxIncome / 100000).toFixed(0)} Lakh/year` : 'No limit', icon: '💰' },
                { label: 'Categories', value: scheme.categories.join(', '), icon: '🏷️' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-[#132040] rounded-xl p-4 flex gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-white text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => navigate('eligibility', scheme.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors">
                Check My Eligibility →
              </button>
            </div>
          </div>
        )}

        {tab === 'Benefits' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Key Benefits</h2>
            <div className="space-y-3">
              {scheme.benefits.map((b, i) => (
                <div key={i} className="flex gap-3 items-start bg-[#132040] rounded-xl p-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-slate-200 text-sm">{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Documents' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Required Documents</h2>
            <div className="space-y-2">
              {scheme.documents.map((doc, i) => (
                <div key={i} className="flex gap-3 items-center bg-[#132040] rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-slate-200 text-sm">{doc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => navigate('documents', scheme.id)} className="w-full border border-white/15 hover:border-white/30 text-white py-3 rounded-xl font-medium transition-colors text-sm">
                Get Personalized Document Checklist →
              </button>
            </div>
          </div>
        )}

        {tab === 'Process' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Application Process</h2>
            <div className="space-y-4">
              {scheme.applicationProcess.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">{i + 1}</div>
                  <div className="flex-1 bg-[#132040] rounded-xl p-4">
                    <p className="text-slate-200 text-sm">{step}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => navigate('guidance', scheme.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors">
                Get Step-by-Step Guidance →
              </button>
            </div>
          </div>
        )}

        {tab === 'Partners' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Authorized Channel Partners</h2>
            <p className="text-slate-400 text-sm mb-6">These organizations can accept and process your application for this scheme.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {['Public Sector Banks', 'Regional Rural Banks', 'Cooperative Banks', 'KVIC / KVIB Offices', 'District Industries Centres', 'State Channelizing Agencies'].map(p => (
                <div key={p} className="flex items-center gap-3 bg-[#132040] rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400">🏦</div>
                  <p className="text-slate-200 text-sm">{p}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('partners')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors">
              Find Nearest Partner →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
