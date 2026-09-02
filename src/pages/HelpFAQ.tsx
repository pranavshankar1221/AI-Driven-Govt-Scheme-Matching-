import { useState } from 'react';
import type { NavProps } from '../types';
import { faqs } from '../data/schemes';
import { useLanguage } from '../context/LanguageContext';

const categories = [
  { label: 'Getting Started' },
  { label: 'Schemes & Eligibility' },
  { label: 'Privacy & Security' },
  { label: 'AI Assistance' },
  { label: 'Multilingual Support' },
  { label: 'Bank Partners' },
];

export default function HelpFAQ({ navigate, onBack }: NavProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const { t, getLocalizedFAQs } = useLanguage();

  const locFaqs = getLocalizedFAQs();

  const filtered = locFaqs.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={() => {
            if (onBack) onBack();
            else navigate('home');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold transition-colors"
        >
          <span>←</span>
          <span>{t('back')}</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 theme-text-muted text-xs sm:text-sm mb-4">
        <button onClick={() => navigate('home')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('home')}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('help')}</span>
      </div>

      {/* Header */}
      <div className="mb-6 pb-3 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('faqsTitle')}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
          {t('faqsSubtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('catalogSearchPlaceholder')}
          className="w-full theme-input rounded-lg px-4 py-2.5 theme-text-main text-xs sm:text-sm outline-none shadow-sm"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(({ label }) => (
          <button
            key={label}
            onClick={() => setSelectedCat(selectedCat === label ? null : label)}
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium border ${
              selectedCat === label
                ? 'bg-[#004b87] border-[#004b87] text-white font-semibold shadow-sm'
                : 'border-slate-200 dark:border-white/10 theme-card-subtle theme-text-muted hover:theme-text-main'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-2.5 mb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-8 theme-card rounded-lg p-6 border theme-border text-xs theme-text-muted">
            {t('noSchemesFound')}
          </div>
        ) : (
          filtered.map(({ q, a }, i) => (
            <div key={i} className="theme-card rounded-lg overflow-hidden border theme-border shadow-xs">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
                aria-expanded={openFaq === i}
              >
                <span className="theme-text-main font-semibold text-xs sm:text-sm pr-4 leading-snug">{q}</span>
                <span className="text-base text-slate-400 font-bold ml-2 font-mono">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 pt-1 border-t theme-border bg-slate-50/50 dark:bg-black/20 text-xs theme-text-muted leading-relaxed">
                  {a}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Citizen Support Help Strip */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: t('askAi'), desc: t('portalFooterTag'), action: () => navigate('ai-matcher'), btn: t('askAi') },
          { title: t('citizenSupport'), desc: '1800-11-2024 · Mon–Sat, 9:00 AM – 6:00 PM', action: () => alert('Helpline: 1800-11-2024 (Toll-Free)'), btn: t('tollFree') },
          { title: t('feedbackTitle'), desc: 'support@sahaya.gov.in · Official Response', action: () => alert('Support email: support@sahaya.gov.in'), btn: t('feedbackSubmit') },
        ].map(({ title, desc, action, btn }) => (
          <div key={title} className="theme-card rounded-lg p-5 border theme-border text-center shadow-sm flex flex-col justify-between hover:border-[#004b87] transition-all">
            <div>
              <h3 className="theme-text-main font-bold text-xs sm:text-sm mb-1">{title}</h3>
              <p className="theme-text-muted text-[11px] mb-3 leading-relaxed">{desc}</p>
            </div>
            <button
              onClick={action}
              className="gov-btn-primary py-2 text-xs text-center font-bold"
            >
              {btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
