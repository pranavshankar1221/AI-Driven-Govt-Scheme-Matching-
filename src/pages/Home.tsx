import { useState } from 'react';
import type { NavProps } from '../types';
import { schemes, faqs } from '../data/schemes';

const stats = [
  { value: '500+', label: 'Govt. Schemes Listed' },
  { value: '18L+', label: 'Beneficiaries Guided' },
  { value: '94%', label: 'Eligibility Accuracy' },
  { value: '6', label: 'Indian Languages' },
];

const steps = [
  { n: '01', title: 'Share Your Profile', desc: 'Your business type, income, age, location and category.', icon: '👤' },
  { n: '02', title: 'AI Matches Schemes', desc: 'Instantly matched against 500+ central and state schemes.', icon: '🤖' },
  { n: '03', title: 'Check Eligibility', desc: 'Clear criteria-wise eligibility report for each scheme.', icon: '✓' },
  { n: '04', title: 'Apply with Guidance', desc: 'Step-by-step guidance and nearest authorized partner.', icon: '🏦' },
];

const features = [
  { icon: '⚡', title: 'AI Scheme Matching', desc: 'Smart discovery tailored to your profile in seconds.' },
  { icon: '✅', title: 'Eligibility Checker', desc: 'Criteria-wise eligibility report with actionable guidance.' },
  { icon: '📊', title: 'Financial Calculator', desc: 'Estimate EMI, subsidy, and total repayment instantly.' },
  { icon: '📋', title: 'Document Checklist', desc: 'Personalized list of required documents per scheme.' },
  { icon: '📍', title: 'Partner Locator', desc: 'Find authorized banks and agencies near you.' },
  { icon: '🌐', title: 'Multilingual Support', desc: 'Tamil, Hindi, Telugu, Kannada, Malayalam, English.' },
];

const schemeTypes = [
  { label: 'Business & Entrepreneurship', count: 184, icon: '💼' },
  { label: 'Housing & Infrastructure', count: 67, icon: '🏠' },
  { label: 'Agriculture & Rural', count: 112, icon: '🌾' },
  { label: 'Skill Development', count: 95, icon: '🎓' },
  { label: 'Women Empowerment', count: 78, icon: '👩' },
  { label: 'Social Welfare', count: 143, icon: '🤝' },
];

export default function Home({ navigate }: NavProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) navigate('catalog');
    else navigate('ai-matcher');
  };

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative bg-[#0b1629] pt-16 pb-20 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-25" style={{ background: 'radial-gradient(ellipse at 50% 0%, #2563eb 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Breadcrumb-style badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Government Welfare · AI-Powered Platform
          </div>

          <h1 className="text-[2.6rem] sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Discover the Right<br />
            <span className="text-blue-400">Government Scheme</span> for You
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Sahaya uses AI to match your profile against 500+ central and state schemes — check eligibility, calculate assistance, and get guided to apply.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center bg-[#0f1f3d] border border-white/12 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
              <svg className="w-5 h-5 text-slate-500 ml-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. loan for tailoring business, housing scheme, skill training…"
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none px-4 py-4"
              />
              <button
                onClick={handleSearch}
                className="m-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/25 whitespace-nowrap"
              >
                Find Schemes
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2.5">Or use the AI Matcher for personalized recommendations</p>
          </div>

          {/* Quick action pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Business Loan', page: 'ai-matcher' as const },
              { label: 'Housing Scheme', page: 'catalog' as const },
              { label: 'Skill Development', page: 'catalog' as const },
              { label: 'Women Entrepreneur', page: 'catalog' as const },
              { label: 'Street Vendor', page: 'catalog' as const },
            ].map(({ label, page }) => (
              <button
                key={label}
                onClick={() => navigate(page)}
                className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/5 px-4 py-2 rounded-full transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-[#060e1d] border-y border-white/6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center px-6 py-2">
                <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR SCHEMES ── */}
      <section className="py-20 bg-[#0b1629]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Discover</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Popular Schemes</h2>
            </div>
            <button
              onClick={() => navigate('catalog')}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all schemes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemes.slice(0, 6).map((scheme) => (
              <div
                key={scheme.id}
                className="group bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 flex flex-col hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.badge && (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">{scheme.badge}</span>
                    )}
                    <span className="text-[11px] text-blue-400 bg-blue-400/8 border border-blue-400/15 px-2 py-0.5 rounded-md">{scheme.type}</span>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 group-hover:text-blue-300 transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {scheme.name}
                </h3>
                <p className="text-[11px] text-slate-500 mb-2 font-medium">{scheme.organization}</p>
                <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-4 line-clamp-2">{scheme.purpose}</p>

                <div className="bg-[#132040] border border-white/5 rounded-xl px-3.5 py-2.5 mb-4">
                  <p className="text-[10px] text-slate-500 font-medium mb-0.5 uppercase tracking-wide">Financial Assistance</p>
                  <p className="text-xs text-amber-400 font-semibold leading-snug">{scheme.financialAssistance}</p>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => navigate('scheme-details', scheme.id)}
                    className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate('eligibility', scheme.id)}
                    className="flex-1 text-xs border border-white/12 hover:border-white/25 text-slate-300 hover:text-white py-2 rounded-lg transition-colors"
                  >
                    Check Eligibility
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHEME CATEGORIES ── */}
      <section className="py-16 bg-[#060e1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Browse by Category</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Find schemes by sector</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {schemeTypes.map(({ label, count, icon }) => (
              <button
                key={label}
                onClick={() => navigate('catalog')}
                className="group bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 text-left hover:border-blue-500/30 hover:bg-blue-600/5 transition-all"
              >
                <span className="text-2xl block mb-3">{icon}</span>
                <p className="text-white text-xs font-semibold leading-snug mb-1 group-hover:text-blue-300 transition-colors">{label}</p>
                <p className="text-slate-500 text-[11px]">{count} schemes</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-[#0b1629]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              From profile to application in 4 steps
            </h2>
          </div>

          {/* Steps — horizontal with connectors */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px border-t border-dashed border-white/10" style={{ top: '40px' }} />

            {steps.map(({ n, title, desc, icon }, i) => (
              <div key={n} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#0f1f3d] border border-white/8 flex flex-col items-center justify-center mb-5 shadow-lg">
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="text-[10px] text-slate-600 font-mono font-semibold">{n}</span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('ai-matcher')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/25 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Start AI Matching
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 bg-[#060e1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left text */}
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Platform Features</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Everything you need to access government welfare
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Sahaya brings together AI matching, eligibility checks, financial calculations, document guidance, and partner discovery — all in one free platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('ai-matcher')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-600/20">
                  Try AI Matcher
                </button>
                <button onClick={() => navigate('catalog')} className="px-5 py-2.5 border border-white/15 hover:border-white/30 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors">
                  Browse Schemes
                </button>
              </div>
            </div>

            {/* Right feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center mb-3 text-lg">
                    {icon}
                  </div>
                  <p className="text-white font-semibold text-xs mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNER LOCATOR STRIP ── */}
      <section className="py-16 bg-[#0b1629]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Authorized Partners</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Apply at a partner near you</h2>
            </div>
            <button
              onClick={() => navigate('partners')}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              Find Partners <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { type: 'Public Sector Banks', count: '200+', icon: '🏦', desc: 'Canara, SBI, Bank of Baroda…' },
              { type: 'District Industries Centres', count: '80+', icon: '🏛️', desc: 'State DIC offices across India' },
              { type: 'KVIC / KVIB Offices', count: '45+', icon: '🏢', desc: 'Khadi Village Industries offices' },
              { type: 'NBFCs & MFIs', count: '150+', icon: '🏢', desc: 'Microfinance and NBFC partners' },
            ].map(({ type, count, icon, desc }) => (
              <button
                key={type}
                onClick={() => navigate('partners')}
                className="group bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 text-left hover:border-blue-500/25 hover:bg-blue-600/3 transition-all"
              >
                <span className="text-3xl block mb-3">{icon}</span>
                <p className="text-2xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{count}</p>
                <p className="text-white text-xs font-semibold mb-1">{type}</p>
                <p className="text-slate-500 text-[11px]">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-[#060e1d]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Frequently Asked Questions</h2>
            </div>
            <button onClick={() => navigate('faq')} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {faqs.slice(0, 6).map(({ q, a }, i) => (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-colors ${openFaq === i ? 'border-blue-500/30 bg-[#0f1f3d]' : 'border-white/8 bg-[#0f1f3d] hover:border-white/15'}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-white text-sm font-medium pr-6 leading-snug">{q}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
