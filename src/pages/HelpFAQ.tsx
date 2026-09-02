import { useState } from 'react';
import type { NavProps } from '../types';
import { faqs } from '../data/schemes';

const categories = [
  { label: 'Getting Started', icon: '🚀', questions: [0, 5] },
  { label: 'Schemes & Eligibility', icon: '📋', questions: [1, 4] },
  { label: 'Privacy & Security', icon: '🔒', questions: [2] },
  { label: 'AI Assistant', icon: '🤖', questions: [7] },
  { label: 'Languages', icon: '🌐', questions: [3] },
  { label: 'Partners & Application', icon: '🏦', questions: [6] },
];

export default function HelpFAQ({ navigate }: NavProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filtered = faqs.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <span className="text-white">Help & FAQs</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>How can we help?</h1>
        <p className="text-slate-400 mb-6">Find answers to common questions about Sahaya</p>
        <div className="relative max-w-xl mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your question…" className="w-full bg-[#0f1f3d] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500/50 transition-colors" />
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {categories.map(({ label, icon }) => (
          <button key={label} onClick={() => setSelectedCat(selectedCat === label ? null : label)} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedCat === label ? 'bg-blue-600/15 border-blue-500/40 text-white' : 'bg-[#0f1f3d] border-white/8 text-slate-400 hover:border-white/20 hover:text-white'}`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {search ? `Results for "${search}"` : 'All Questions'}
        </h2>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p className="text-2xl mb-2">🤔</p>
            <p>No results found. Try asking the AI Assistant instead.</p>
          </div>
        )}
        <div className="space-y-3">
          {filtered.map(({ q, a }, i) => (
            <div key={i} className="bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors">
                <span className="text-white font-medium text-sm pr-4">{q}</span>
                <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <p className="text-slate-400 text-sm leading-relaxed pt-4">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact support */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: '💬', title: 'Chat with AI', desc: 'Ask Sahaya AI any question instantly', action: () => navigate('ai-matcher'), btn: 'Open AI Chat' },
          { icon: '📞', title: 'Call Helpline', desc: '1800-XXX-XXXX · Mon–Sat, 9 AM – 6 PM', action: () => {}, btn: 'Call Now' },
          { icon: '📧', title: 'Email Support', desc: 'help@sahaya.gov.in · Reply within 24 hrs', action: () => {}, btn: 'Send Email' },
        ].map(({ icon, title, desc, action, btn }) => (
          <div key={title} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 text-center hover:border-white/20 transition-colors">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
            <p className="text-slate-500 text-xs mb-4">{desc}</p>
            <button onClick={action} className="text-xs bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/25 px-4 py-2 rounded-xl transition-colors">{btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
