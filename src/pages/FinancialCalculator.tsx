import { useState, useEffect } from 'react';
import type { NavProps, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  scheme: Scheme;
}

export default function FinancialCalculator({
  navigate,
  scheme,
  previousPage,
  previousLabel,
  onBack,
}: Props) {
  const [amount, setAmount] = useState(300000);
  const [rate, setRate] = useState(8);
  const [tenure, setTenure] = useState(36);
  const [moratorium, setMoratorium] = useState(6);
  const [subsidyPct, setSubsidyPct] = useState(25);
  const [, setShowResult] = useState(true);
  const { t, getLocalizedScheme } = useLanguage();

  const locScheme = getLocalizedScheme(scheme);

  const subsidy = (amount * subsidyPct) / 100;
  const loanAmount = Math.max(0, amount - subsidy);
  const monthlyRate = rate / 12 / 100;
  const effectiveTenure = Math.max(1, tenure - moratorium);
  const emi =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, effectiveTenure)) /
        (Math.pow(1 + monthlyRate, effectiveTenure) - 1)
      : 0;
  const totalRepayment = emi * effectiveTenure;
  const totalInterest = Math.max(0, totalRepayment - loanAmount);

  useEffect(() => {
    setShowResult(false);
    const timer = setTimeout(() => setShowResult(true), 100);
    return () => clearTimeout(timer);
  }, [amount, rate, tenure, moratorium, subsidyPct]);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

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

  const SliderInput = ({
    label,
    value,
    min,
    max,
    step = 1,
    suffix = '',
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="theme-text-muted font-bold uppercase">{label}</label>
        <span className="theme-text-main font-bold theme-card-subtle px-2 py-0.5 rounded border theme-border font-mono">
          {suffix === '₹' ? fmt(value) : `${value}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 appearance-none cursor-pointer accent-[#004b87] dark:accent-sky-400"
      />
      <div className="flex justify-between text-[10px] theme-text-muted font-medium">
        <span>{suffix === '₹' ? fmt(min) : `${min}${suffix}`}</span>
        <span>{suffix === '₹' ? fmt(max) : `${max}${suffix}`}</span>
      </div>
    </div>
  );

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
        <span className="theme-text-main font-semibold">{t('calculateSubsidy')}</span>
      </div>

      <div className="mb-6 pb-3 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('calculateSubsidy')}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
          {t('catalogSubtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* INPUTS Column */}
        <div className="theme-card rounded-md p-5 sm:p-6 space-y-5 shadow-xs border theme-border">
          <div>
            <p className="text-[10px] theme-text-muted uppercase tracking-wider font-bold mb-1.5">{t('selectedScheme')}</p>
            <div className="theme-card-subtle rounded p-3 border theme-border">
              <p className="theme-text-main font-bold text-xs sm:text-sm">{locScheme.name}</p>
              <p className="text-[11px] theme-text-muted">{locScheme.financialAssistance}</p>
            </div>
          </div>

          <SliderInput
            label={t('totalProjectOutlay')}
            value={amount}
            min={50000}
            max={2500000}
            step={25000}
            suffix="₹"
            onChange={setAmount}
          />

          <SliderInput
            label={t('subsidyRate')}
            value={subsidyPct}
            min={0}
            max={35}
            step={5}
            suffix="%"
            onChange={setSubsidyPct}
          />

          <SliderInput
            label={t('interestRate')}
            value={rate}
            min={5}
            max={14}
            step={0.5}
            suffix="%"
            onChange={setRate}
          />

          <SliderInput
            label={t('loanTenure')}
            value={tenure}
            min={12}
            max={84}
            step={6}
            suffix={` ${t('months')}`}
            onChange={setTenure}
          />

          <SliderInput
            label={t('moratorium')}
            value={moratorium}
            min={0}
            max={18}
            step={3}
            suffix={` ${t('months')}`}
            onChange={setMoratorium}
          />
        </div>

        {/* RESULTS Column */}
        <div className="space-y-4">
          <div className="theme-card rounded-md p-5 sm:p-6 shadow-xs border theme-border space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider theme-text-muted" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('financialAssessment')}
            </h2>

            {/* Top Stat: Monthly EMI */}
            <div className="theme-card-subtle rounded p-4 border theme-border">
              <span className="text-[10px] theme-text-muted uppercase tracking-wider font-bold">{t('estimatedEmi')}</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#004b87] dark:text-sky-300 mt-1 font-mono">
                {fmt(emi)}<span className="text-xs font-normal text-slate-500">{t('perMonth')}</span>
              </p>
              <p className="text-[10px] theme-text-muted mt-1">{effectiveTenure} {t('months')} • {moratorium} {t('months')} {t('moratorium')}</p>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="theme-card-subtle rounded p-3 border theme-border">
                <span className="text-[10px] theme-text-muted uppercase font-bold block">{t('totalProjectCost')}</span>
                <span className="theme-text-main font-bold text-sm block mt-0.5">{fmt(amount)}</span>
              </div>
              <div className="theme-card-subtle rounded p-3 border theme-border">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">{t('govSubsidy')}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm block mt-0.5">{fmt(subsidy)} ({subsidyPct}%)</span>
              </div>
              <div className="theme-card-subtle rounded p-3 border theme-border">
                <span className="text-[10px] theme-text-muted uppercase font-bold block">{t('netBankLoan')}</span>
                <span className="theme-text-main font-bold text-sm block mt-0.5">{fmt(loanAmount)}</span>
              </div>
              <div className="theme-card-subtle rounded p-3 border theme-border">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">{t('totalInterestCost')}</span>
                <span className="text-amber-800 dark:text-amber-300 font-bold text-sm block mt-0.5">{fmt(totalInterest)}</span>
              </div>
            </div>

            {/* Total Repayment */}
            <div className="flex justify-between items-center pt-3 border-t theme-border text-xs">
              <span className="theme-text-muted font-semibold">{t('totalRepayable')}</span>
              <span className="theme-text-main font-bold text-sm font-mono">{fmt(totalRepayment)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => navigate('documents', scheme.id)}
                className="flex-1 py-2.5 gov-btn-secondary text-xs text-center"
              >
                {t('requiredDocs')} →
              </button>
              <button
                onClick={() => navigate('partners', scheme.id)}
                className="flex-1 py-2.5 gov-btn-primary text-xs text-center"
              >
                {t('findLendingBank')}
              </button>
            </div>
          </div>

          <div className="theme-card-subtle rounded p-3 border theme-border text-[11px] theme-text-muted leading-relaxed">
            {t('calcDisclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}
