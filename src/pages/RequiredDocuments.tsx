import { useState } from 'react';
import type { NavProps, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  scheme: Scheme;
}

const allDocs = [
  { category: 'Identity & Address Proofs', docs: [
    { name: 'Aadhaar Card', required: true, note: 'Self-attested photocopy with original for biometric verification' },
    { name: 'PAN Card', required: true, note: 'Mandatory for bank loan disbursements exceeding ₹50,000' },
    { name: 'Voter ID / Passport', required: false, note: 'Secondary proof of residency & citizenship' },
  ]},
  { category: 'Income & Social Category Certificates', docs: [
    { name: 'Income Certificate', required: true, note: 'Issued by Tahsildar / Revenue Authority within past 6 months' },
    { name: 'Caste Certificate (SC/ST/OBC/EWS)', required: false, note: 'Required for special category capital subsidy benefits' },
    { name: 'BPL / Antyodaya Ration Card', required: false, note: 'Enables additional fee waivers if applicable' },
  ]},
  { category: 'Business & Project Plan', docs: [
    { name: 'Project Detailed Appraisal Report', required: true, note: 'Outline machinery costs, working capital, and projected revenue' },
    { name: 'Skill Training / EDP Certificate', required: false, note: 'Strengthens micro-enterprise loan priority' },
    { name: 'Udyam MSME Registration', required: false, note: 'Recommended for existing units seeking expansion' },
  ]},
  { category: 'Banking & Financial Credentials', docs: [
    { name: 'Bank Statement (Past 6 Months)', required: true, note: 'Savings account statement from any scheduled commercial bank' },
    { name: 'Cancelled Bank Cheque', required: true, note: 'Required for direct electronic subsidy benefit credit' },
  ]},
  { category: 'Educational & Photographs', docs: [
    { name: 'Educational Certificate (Class 8+)', required: true, note: 'Mandatory for manufacturing loan projects above ₹10 Lakhs' },
    { name: 'Recent Passport Photographs (4 Copies)', required: true, note: 'Recent colored photograph with white background' },
  ]},
];

export default function RequiredDocuments({
  navigate,
  scheme,
  previousPage,
  previousLabel,
  onBack,
}: Props) {
  const { t, getLocalizedScheme } = useLanguage();
  const locScheme = getLocalizedScheme(scheme);

  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set(['Aadhaar Card', 'Income Certificate', 'Cancelled Bank Cheque', 'Recent Passport Photographs (4 Copies)']));
  const toggle = (name: string) => setCheckedDocs(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const totalRequired = allDocs.flatMap(c => c.docs).filter(d => d.required).length;
  const checkedRequired = allDocs.flatMap(c => c.docs).filter(d => d.required && checkedDocs.has(d.name)).length;
  const progress = Math.round((checkedRequired / totalRequired) * 100);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('scheme-details', scheme.id);
    }
  };

  const backLabel =
    previousPage === 'ai-matcher'
      ? t('backToAiMatcherResults')
      : locScheme.name;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold transition-colors"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 theme-text-muted text-xs sm:text-sm mb-4 flex-wrap">
        <button onClick={() => navigate('home')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('home')}</button>
        <span>/</span>
        {previousPage === 'ai-matcher' ? (
          <>
            <button onClick={() => navigate('ai-matcher')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('aiMatcher')}</button>
            <span>/</span>
          </>
        ) : (
          <>
            <button onClick={() => navigate('catalog')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('schemes')}</button>
            <span>/</span>
          </>
        )}
        <button onClick={() => navigate('scheme-details', scheme.id)} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors truncate max-w-xs">{locScheme.name}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('requiredDocs')}</span>
      </div>

      {/* Header */}
      <div className="theme-card rounded-md p-5 sm:p-6 mb-5 border theme-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#004b87] dark:text-sky-400 font-bold uppercase tracking-wider mb-0.5 block">{t('docChecklist')}</span>
          <h1 className="text-xl sm:text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('requiredDocs')} • {locScheme.name}
          </h1>
          <p className="theme-text-muted text-xs mt-0.5">
            {t('docGuidance')}
          </p>
        </div>

        {/* Progress gauge */}
        <div className="text-center theme-card-subtle border theme-border rounded px-4 py-2 flex-shrink-0 min-w-32">
          <span className="text-2xl font-extrabold text-[#004b87] dark:text-sky-300 font-mono">{progress}%</span>
          <p className="text-[9px] theme-text-muted font-bold uppercase mt-0.5">{checkedRequired}/{totalRequired} {t('docsReady')}</p>
        </div>
      </div>

      {/* Document Sections */}
      <div className="space-y-4">
        {allDocs.map((cat, ci) => (
          <div key={ci} className="theme-card rounded-md p-4 sm:p-5 border theme-border shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider theme-text-main mb-3 flex items-center gap-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <span>📁</span>
              <span>{cat.category}</span>
            </h2>

            <div className="space-y-2">
              {cat.docs.map((doc, di) => {
                const isChecked = checkedDocs.has(doc.name);
                return (
                  <div
                    key={di}
                    onClick={() => toggle(doc.name)}
                    className={`flex items-start gap-3 rounded p-3 transition-colors cursor-pointer border ${
                      isChecked
                        ? 'theme-card-subtle border-emerald-500/30'
                        : 'theme-card-subtle border theme-border'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center flex-shrink-0 text-[10px] font-bold border transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 dark:border-white/20 theme-card'
                    }`}>
                      {isChecked && '✓'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-xs font-semibold ${isChecked ? 'line-through opacity-70 theme-text-muted' : 'theme-text-main'}`}>
                          {doc.name}
                        </span>
                        {doc.required ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                            {t('mandatory')}
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded theme-card-subtle theme-text-muted border theme-border">
                            {t('optional')}
                          </span>
                        )}
                      </div>
                      <p className="theme-text-muted text-xs leading-relaxed">{doc.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => navigate('guidance', scheme.id)}
            className="flex-1 py-2.5 gov-btn-primary text-xs text-center font-bold"
          >
            {t('applicationGuidance')} →
          </button>
          <button
            onClick={() => navigate('partners', scheme.id)}
            className="flex-1 py-2.5 gov-btn-secondary text-xs text-center"
          >
            {t('channelPartners')} →
          </button>
        </div>
      </div>
    </div>
  );
}
