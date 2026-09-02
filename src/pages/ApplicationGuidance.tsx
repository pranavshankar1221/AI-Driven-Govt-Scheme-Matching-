import { useState } from 'react';
import type { NavProps, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  scheme: Scheme;
}

const steps = [
  { n: 1, title: 'Profile & Eligibility Verification', desc: 'Confirm you meet all age, social category, and location criteria for the scheme.', duration: '5–10 min', status: 'done' as const, tips: ['Keep Aadhaar number handy', 'Verify your social category (SC/ST/OBC/General)', 'Confirm your enterprise activity is eligible'] },
  { n: 2, title: 'Document Collection & Verification', desc: 'Gather mandatory KYC, income, and educational certificates before bank submission.', duration: '2–5 days', status: 'active' as const, tips: ['Obtain income certificate from Tahsildar / Revenue Authority', 'Obtain caste certificate from competent authority if applicable', 'Prepare a project report with cost breakdown'] },
  { n: 3, title: 'Official Portal Registration', desc: 'Create an account on the notified government scheme portal (e.g. kviconline.gov.in / udyamimitra.in).', duration: '15–20 min', status: 'pending' as const, tips: ['Use Aadhaar-linked mobile number for OTP', 'Keep PAN card handy for verification', 'Record application login credentials safely'] },
  { n: 4, title: 'Online Application Submission', desc: 'Complete the detailed application form online with your personal, business, and financial project details.', duration: '30–45 min', status: 'pending' as const, tips: ['Fill all required fields accurately', 'Double-check project cost machinery items', 'Attach digitized copies of documents (PDF format)'] },
  { n: 5, title: 'Submit to Nearest Authorized Bank Partner', desc: 'Visit your nearest authorized channel partner (bank branch or DIC) with your application printout and original proofs.', duration: '1 day', status: 'pending' as const, tips: ['Carry all original documents for physical verification', 'Request signed acknowledgement receipt', 'Keep duplicate copies of all submitted forms'] },
  { n: 6, title: 'Personal Appraisal & Credit Assessment', desc: 'The partner bank conducts project appraisal and evaluates enterprise viability and repayment capacity.', duration: '1–2 weeks', status: 'pending' as const, tips: ['Be prepared to explain business operations', 'Know your machine costs and monthly revenue projections', 'EDP training participation may be scheduled'] },
  { n: 7, title: 'EDP Entrepreneurship Training', desc: 'Complete mandatory Entrepreneurship Development Programme (EDP) training organized by nodal agencies.', duration: '7–10 days', status: 'pending' as const, tips: ['Attend all training sessions — attendance is mandatory', 'Training is provided free of cost', 'Completion certificate is required before loan disbursement'] },
  { n: 8, title: 'Loan Sanction & Subsidy Credit', desc: 'The partner bank issues formal loan sanction letter and disburses funds. Capital subsidy is linked directly.', duration: '2–4 weeks', status: 'pending' as const, tips: ['Open dedicated business current account for disbursements', 'Subsidy is held in TDR for 3 years as per guidelines', 'EMI schedule begins after agreed moratorium period'] },
];

export default function ApplicationGuidance({
  navigate,
  scheme,
  previousPage,
  previousLabel,
  onBack,
}: Props) {
  const [activeStep, setActiveStep] = useState(1);
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
        <button onClick={() => navigate('scheme-details', scheme.id)} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors truncate max-w-xs">{locScheme.name}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('applicationGuidance')}</span>
      </div>

      <div className="mb-6 pb-3 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('applicationGuidanceTitle')}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
          {t('guidanceSubtitle')}
        </p>
      </div>

      {/* Progress Summary Card */}
      <div className="theme-card rounded-md p-4 mb-6 flex flex-wrap gap-4 items-center justify-between border theme-border shadow-xs">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] theme-text-muted uppercase tracking-wider font-bold mb-1.5">{t('applicationStatus')}</p>
          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#004b87] dark:bg-sky-400" style={{ width: '25%' }} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#004b87] dark:text-sky-300 font-mono" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>2 / 8</p>
          <p className="text-[9px] theme-text-muted uppercase font-bold">{t('verification')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Steps List */}
        <div className="space-y-2">
          {steps.map(step => {
            const isActive = activeStep === step.n;
            return (
              <div
                key={step.n}
                onClick={() => setActiveStep(step.n)}
                className={`theme-card rounded p-3 transition-colors cursor-pointer border ${
                  isActive ? 'border-[#004b87] dark:border-sky-400 ring-1 ring-[#004b87]' : 'theme-border hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    step.status === 'done'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'active'
                      ? 'bg-[#004b87] text-white ring-2 ring-blue-300'
                      : 'theme-card-subtle theme-text-muted border theme-border'
                  }`}>
                    {step.status === 'done' ? '✓' : step.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#004b87] dark:text-sky-300 font-bold' : 'theme-text-main'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] theme-text-muted">{step.duration}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Detail */}
        {(() => {
          const s = steps.find(x => x.n === activeStep) ?? steps[0];
          return (
            <div className="lg:col-span-2 theme-card rounded-md p-6 border theme-border shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#004b87] text-white flex items-center justify-center font-bold text-xs">
                  {s.n}
                </span>
                <div>
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 font-bold uppercase tracking-wider block">{t('step1')} {s.n} / 8</span>
                  <h2 className="text-base font-bold theme-text-main" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.title}</h2>
                </div>
              </div>

              <p className="theme-text-secondary text-xs sm:text-sm leading-relaxed">{s.desc}</p>

              <div className="theme-card-subtle rounded p-4 border theme-border">
                <p className="text-[10px] font-bold text-[#004b87] dark:text-sky-300 uppercase tracking-wider mb-2">{t('stepByStepProcess')}</p>
                <ul className="space-y-1.5">
                  {s.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs theme-text-main">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-3 border-t theme-border text-xs">
                <button
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 gov-btn-secondary disabled:opacity-40"
                >
                  {t('back')}
                </button>
                <span className="theme-text-muted text-[11px] font-mono">{activeStep} / {steps.length}</span>
                <button
                  disabled={activeStep === steps.length}
                  onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
                  className="px-3 py-1.5 gov-btn-primary disabled:opacity-40"
                >
                  {t('nextStep')} →
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
