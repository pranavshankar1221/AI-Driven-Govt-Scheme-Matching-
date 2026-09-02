import { useState } from 'react';
import type { NavProps, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  scheme: Scheme;
}

export default function SchemeDetails({
  navigate,
  scheme,
  previousPage,
  previousLabel,
  onBack,
}: Props) {
  const [tab, setTab] = useState('Overview');
  const { t, getLocalizedScheme } = useLanguage();

  const locScheme = getLocalizedScheme(scheme);
  const tabKeys: { id: string; labelKey: string }[] = [
    { id: 'Overview', labelKey: 'overview' },
    { id: 'Eligibility', labelKey: 'eligibility' },
    { id: 'Benefits', labelKey: 'benefits' },
    { id: 'Documents', labelKey: 'documents' },
    { id: 'Process', labelKey: 'process' },
    { id: 'Partners', labelKey: 'partners' },
  ];

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (previousPage === 'ai-matcher') {
      navigate('ai-matcher');
    } else {
      navigate('catalog');
    }
  };

  const backLabel =
    previousPage === 'ai-matcher'
      ? t('backToAiMatcherResults')
      : previousLabel
      ? previousLabel
      : t('backToSchemesDirectory');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
        <span className="theme-text-main font-semibold truncate max-w-xs">{locScheme.name}</span>
      </div>

      {/* Header Dossier */}
      <div className="theme-card rounded-md p-6 mb-6 shadow-sm border theme-border">
        <div className="flex flex-wrap gap-2 mb-2.5">
          {locScheme.badge && (
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
              {locScheme.badge}
            </span>
          )}
          <span className="text-[10px] text-[#004b87] dark:text-sky-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded font-semibold">
            {locScheme.type}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main mb-1 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {locScheme.name}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mb-5 font-medium">{locScheme.organization}</p>

        {/* Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div className="theme-card-subtle border theme-border rounded p-3">
            <p className="text-[10px] theme-text-muted uppercase tracking-wider font-semibold mb-0.5">{t('financialAssistance')}</p>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-bold leading-snug">{locScheme.financialAssistance}</p>
          </div>
          <div className="theme-card-subtle border theme-border rounded p-3">
            <p className="text-[10px] theme-text-muted uppercase tracking-wider font-semibold mb-0.5">{t('targetGroups')}</p>
            <p className="text-xs sm:text-sm text-[#004b87] dark:text-sky-300 font-semibold">{locScheme.categories.slice(0, 3).join(', ')}{locScheme.categories.length > 3 ? '…' : ''}</p>
          </div>
          <div className="theme-card-subtle border theme-border rounded p-3">
            <p className="text-[10px] theme-text-muted uppercase tracking-wider font-semibold mb-0.5">{t('ageLimit')}</p>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold">{locScheme.minAge} – {locScheme.maxAge} {t('years')}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-2 border-t theme-border">
          <button
            onClick={() => navigate('eligibility', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
            className="px-4 py-2 gov-btn-primary text-xs flex items-center gap-1.5"
          >
            <span>{t('checkEligibility')}</span>
          </button>
          <button
            onClick={() => navigate('calculator', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
            className="px-4 py-2 gov-btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>{t('calculateSubsidy')}</span>
          </button>
          <button
            onClick={() => navigate('documents', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
            className="px-4 py-2 gov-btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>{t('requiredDocs')}</span>
          </button>
          <button
            onClick={() => navigate('partners', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
            className="px-4 py-2 gov-btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>{t('channelPartners')}</span>
          </button>
          <button
            onClick={() => navigate('guidance', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
            className="px-4 py-2 gov-btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>{t('applicationGuidance')}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b theme-border mb-6 gap-1">
        {tabKeys.map(tOpt => (
          <button
            key={tOpt.id}
            onClick={() => setTab(tOpt.id)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              tab === tOpt.id
                ? 'border-[#004b87] text-[#004b87] dark:text-sky-300 dark:border-sky-400 font-bold'
                : 'border-transparent theme-text-muted hover:theme-text-main'
            }`}
          >
            {t(tOpt.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="theme-card rounded-md p-6 shadow-sm border theme-border">
        {tab === 'Overview' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('descriptionAndPurpose')}</h2>
            <p className="theme-text-secondary text-xs sm:text-sm leading-relaxed">{locScheme.description}</p>
            <div className="theme-card-subtle rounded p-4 border theme-border">
              <h3 className="text-[#004b87] dark:text-sky-300 font-bold mb-1 text-xs uppercase tracking-wider">{t('checkEligibility')}</h3>
              <p className="theme-text-main text-xs sm:text-sm leading-relaxed">{locScheme.eligibilitySummary}</p>
            </div>
          </div>
        )}

        {tab === 'Eligibility' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('whoIsEligible')}</h2>
            <p className="theme-text-muted text-xs leading-relaxed">{locScheme.eligibilitySummary}</p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {[
                { label: t('minAgeReq'), value: `${locScheme.minAge} ${t('years')}` },
                { label: t('maxAgeLimit'), value: `${locScheme.maxAge} ${t('years')}` },
                { label: t('annualIncomeCriteria'), value: locScheme.maxIncome > 0 ? `Under ₹${(locScheme.maxIncome / 100000).toFixed(0)} Lakh/year` : t('noIncomeCeiling') },
                { label: t('socialCategories'), value: locScheme.categories.join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="theme-card-subtle rounded p-3 border theme-border">
                  <p className="text-[10px] theme-text-muted font-bold uppercase">{label}</p>
                  <p className="theme-text-main text-xs sm:text-sm font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('eligibility', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
                className="gov-btn-primary px-4 py-2 text-xs"
              >
                {t('checkEligibility')} →
              </button>
            </div>
          </div>
        )}

        {tab === 'Benefits' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('financialAssistanceSlabs')}</h2>
            <div className="space-y-2">
              {locScheme.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 theme-card-subtle rounded p-3 border theme-border">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                  <span className="theme-text-main text-xs sm:text-sm">{b}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('calculator', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
                className="gov-btn-primary px-4 py-2 text-xs"
              >
                {t('calculateSubsidy')} →
              </button>
            </div>
          </div>
        )}

        {tab === 'Documents' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('requiredDocs')}</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {locScheme.documents.map((doc, i) => (
                <div key={i} className="theme-card-subtle rounded p-2.5 border theme-border flex items-center gap-2">
                  <span>📄</span>
                  <span className="theme-text-main text-xs font-medium">{doc}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('documents', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
                className="gov-btn-primary px-4 py-2 text-xs"
              >
                {t('requiredDocs')} →
              </button>
            </div>
          </div>
        )}

        {tab === 'Process' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('stepByStepProcess')}</h2>
            <div className="space-y-2">
              {locScheme.applicationProcess.map((step, i) => (
                <div key={i} className="flex items-start gap-3 theme-card-subtle rounded p-3 border theme-border">
                  <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="theme-text-main text-xs sm:text-sm mt-0.5">{step}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('guidance', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
                className="gov-btn-primary px-4 py-2 text-xs"
              >
                {t('viewFullGuidance')}
              </button>
            </div>
          </div>
        )}

        {tab === 'Partners' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t('authorizedBankingChannels')}</h2>
            <p className="theme-text-muted text-xs">
              {t('authorizedPartnersDesc')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('partners', scheme.id, { fromPage: 'scheme-details', fromLabel: `${locScheme.name}` })}
                className="gov-btn-primary px-4 py-2 text-xs"
              >
                {t('locateBankBranch')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
