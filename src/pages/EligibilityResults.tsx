import type { NavProps, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  scheme: Scheme;
}

const eligibleCriteria = [
  { label: 'Minimum Age Requirement', detail: 'Age 28 years — meets minimum age requirement of 18 years' },
  { label: 'Indian Citizenship Verification', detail: 'Verified citizen of India' },
  { label: 'Enterprise Activity Classification', detail: 'Tailoring & Garment unit qualifies as Micro Manufacturing enterprise' },
  { label: 'First-Time Enterprise Applicant', detail: 'New enterprise unit — eligible for first-time beneficiary quota' },
  { label: 'Geographic Location Tier', detail: 'Coimbatore, Tamil Nadu — urban area qualifying for 15% capital subsidy tier' },
];

const missingInfo = [
  { label: 'Educational Qualification Certificate', detail: 'Required for loan project costs exceeding ₹10 Lakhs — Class 8+ certificate required', action: 'Upload Document' },
  { label: 'Bank Statement (Past 6 Months)', detail: '6 months active savings account statement required for credit assessment', action: 'Provide Statement' },
];

export default function EligibilityResults({
  navigate,
  scheme,
  previousPage,
  previousLabel,
  onBack,
}: Props) {
  const { t, getLocalizedScheme } = useLanguage();
  const locScheme = getLocalizedScheme(scheme);

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
        <span className="theme-text-main font-semibold">{t('checkEligibility')}</span>
      </div>

      {/* Official Status Banner */}
      <div className="theme-card rounded-md p-5 sm:p-6 mb-5 border theme-border shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.2 rounded uppercase">
                ✓ {t('feat2Title')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('checkEligibility')} • {locScheme.name}
            </h1>
            <p className="theme-text-muted text-xs mt-0.5">
              {locScheme.eligibilitySummary}
            </p>
          </div>

          <div className="text-center theme-card-subtle border theme-border rounded px-4 py-2 flex-shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>87%</span>
            <p className="text-[9px] theme-text-muted font-bold uppercase mt-0.5">{t('matchScore')}</p>
          </div>
        </div>
      </div>

      {/* Target Scheme Quick Strip */}
      <div className="theme-card rounded p-3 mb-5 border theme-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#004b87] dark:text-sky-300 uppercase tracking-wider text-[10px]">{t('ministryAgency')}:</span>
          <span className="theme-text-main">{locScheme.organization}</span>
        </div>
        <button
          onClick={() => navigate('scheme-details', scheme.id)}
          className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
        >
          {t('viewDetails')} →
        </button>
      </div>

      <div className="space-y-5">
        {/* Satisfied Criteria */}
        <div className="theme-card rounded-md p-5 border theme-border shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <span>✓</span>
            <span>{t('checkEligibility')} ({eligibleCriteria.length})</span>
          </h2>
          <div className="space-y-2.5">
            {eligibleCriteria.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 theme-card-subtle rounded p-3 border theme-border">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                <div>
                  <p className="theme-text-main font-semibold text-xs">{c.label}</p>
                  <p className="theme-text-muted text-xs mt-0.5">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing / Unverified Items */}
        <div className="theme-card rounded-md p-5 border theme-border shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
            <span>⚠</span>
            <span>{t('requiredDocs')} ({missingInfo.length})</span>
          </h2>
          <div className="space-y-2.5">
            {missingInfo.map((m, i) => (
              <div key={i} className="flex items-start justify-between gap-3 theme-card-subtle rounded p-3 border theme-border">
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs mt-0.5">⚠</span>
                  <div>
                    <p className="theme-text-main font-semibold text-xs">{m.label}</p>
                    <p className="theme-text-muted text-xs mt-0.5">{m.detail}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('documents', scheme.id)}
                  className="px-2.5 py-1 gov-btn-secondary text-[10px] whitespace-nowrap"
                >
                  {t('upload')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Next Step Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => navigate('calculator', scheme.id)}
            className="flex-1 py-2.5 gov-btn-primary text-xs text-center"
          >
            {t('calculateSubsidy')} →
          </button>
          <button
            onClick={() => navigate('documents', scheme.id)}
            className="flex-1 py-2.5 gov-btn-secondary text-xs text-center"
          >
            {t('requiredDocs')} →
          </button>
          <button
            onClick={() => navigate('partners', scheme.id)}
            className="flex-1 py-2.5 gov-btn-secondary text-xs text-center"
          >
            {t('channelPartners')} →
          </button>
        </div>

        {/* Disclaimer */}
        <div className="theme-card-subtle rounded p-3 border theme-border text-[11px] theme-text-muted leading-relaxed">
          {t('officialNotice')}
        </div>
      </div>
    </div>
  );
}
