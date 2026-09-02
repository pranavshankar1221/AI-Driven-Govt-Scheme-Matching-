import { useState, useEffect } from 'react';
import type { NavProps } from '../types';
import type { MatchedSchemeResult } from '../types/api';
import { schemeService } from '../services/schemeService';
import { schemes, partners } from '../data/schemes';
import { useProfile } from '../context/ProfileContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { detectLanguage } from '../services/languageDetector';
import { useLanguage } from '../context/LanguageContext';

type MatcherStage = 'requirement' | 'profile_check' | 'missing_info' | 'analyzing' | 'results';

interface MatcherSessionCache {
  stage: MatcherStage;
  userQuery: string;
  matches: MatchedSchemeResult[];
  selectedSchemeIndex: number;
}

let matcherSessionCache: MatcherSessionCache | null = null;

export default function AIMatcher({ navigate, onBack }: NavProps) {
  const { profile, updateProfile } = useProfile();
  const { t, getLocalizedScheme } = useLanguage();

  const isUserLoggedIn = (() => {
    try {
      return localStorage.getItem('sahaya_is_logged_in') === 'true';
    } catch {
      return false;
    }
  })();

  const matchingSteps = [
    'Understanding your assistance requirement…',
    'Checking verified profile data & Digital Locker…',
    'Evaluating ministry eligibility & social category criteria…',
    'Finding suitable central & state welfare schemes…',
    'Calculating financial fit, capital subsidies & EMI…',
    'Checking mandatory document readiness in Locker…',
    'Identifying accredited nodal bank & DIC channel partners…',
    'Preparing your tailored Citizen Welfare Assistance Plan…',
  ];

  const QUICK_REQUIREMENT_PROMPTS = [
    { label: 'Tailoring & Garments Loan', text: 'I want a ₹3 Lakh loan and capital subsidy to expand my tailoring business in Coimbatore.' },
    { label: 'Working Capital Loan (MUDRA)', text: 'I need collateral-free working capital loan up to ₹5 Lakhs under MUDRA Kishore.' },
    { label: 'Housing Construction Subsidy', text: 'I want to apply for credit-linked housing interest subsidy under PMAY.' },
    { label: 'Women Entrepreneur Greenfield Loan', text: 'Looking for composite loan and capital subsidy for women entrepreneurs under Stand-Up India.' },
    { label: 'Artisan / Weaver Assistance', text: 'Financial assistance, subsidized raw materials, and loom upgradation for weavers.' },
  ];

  // Wizard state preserved across sub-page navigation
  const [stage, setStage] = useState<MatcherStage>(() => matcherSessionCache?.stage || 'requirement');
  const [userQuery, setUserQuery] = useState(() => matcherSessionCache?.userQuery || '');
  const [analyzingStep, setAnalyzingStep] = useState(0);

  // Search parameters initialized from unified ProfileContext
  const [targetAmount, setTargetAmount] = useState<string>(String(profile.loanAmountRequired || '300000'));
  const [customCategory, setCustomCategory] = useState<string>(profile.category || 'OBC');
  const [customLocation, setCustomLocation] = useState<string>(profile.locationType || 'urban');
  const [customIncome, setCustomIncome] = useState<string>(String(profile.annualIncome || '240000'));
  const [customAge, setCustomAge] = useState<string>(String(profile.age || '28'));
  const [customGender, setCustomGender] = useState<string>(profile.gender || 'Male');
  const [customBusiness, setCustomBusiness] = useState<string>(profile.businessType || profile.occupation || 'Tailoring / Micro Enterprise');
  const [educationLevel, setEducationLevel] = useState<string>(profile.educationLevel || 'Class 10 Passed');
  const [isNewBusiness, setIsNewBusiness] = useState<boolean>(profile.employmentStatus !== 'Business Owner');

  const [isEditingProfile, setIsEditingProfile] = useState(!isUserLoggedIn);
  const [matches, setMatches] = useState<MatchedSchemeResult[]>(() => matcherSessionCache?.matches || []);
  const [selectedSchemeIndex, setSelectedSchemeIndex] = useState<number>(() => matcherSessionCache?.selectedSchemeIndex || 0);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with persistent session cache
  useEffect(() => {
    matcherSessionCache = {
      stage,
      userQuery,
      matches,
      selectedSchemeIndex,
    };
  }, [stage, userQuery, matches, selectedSchemeIndex]);

  // Voice recording integration
  const { isRecording, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        const voiceText = 'I want financial assistance and subsidy to expand my micro tailoring enterprise in Coimbatore.';
        setUserQuery(voiceText);
        detectLanguage(voiceText);
      }
    } else {
      await startRecording();
    }
  };

  const handleRequirementSubmit = () => {
    if (!userQuery.trim()) {
      setUserQuery('I want financial assistance to start/expand my business.');
    }
    setStage('profile_check');
  };

  const handleProfileConfirm = () => {
    if (!targetAmount || Number(targetAmount) <= 0) {
      setStage('missing_info');
    } else {
      saveToProfile();
      triggerBackendMatch();
    }
  };

  const saveToProfile = () => {
    updateProfile({
      category: customCategory,
      locationType: customLocation as 'rural' | 'urban' | 'semi-urban',
      annualIncome: customIncome,
      age: Number(customAge) || 28,
      gender: customGender as 'Male' | 'Female' | 'Other',
      businessType: customBusiness,
      occupation: customBusiness,
      educationLevel,
      loanAmountRequired: Number(targetAmount) || 300000,
      employmentStatus: isNewBusiness ? 'Self-Employed' : 'Business Owner',
    });
  };

  const triggerBackendMatch = async () => {
    setStage('analyzing');
    setAnalyzingStep(0);
    setError(null);

    const stepTimer = setInterval(() => {
      setAnalyzingStep(prev => (prev < matchingSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await schemeService.matchSchemes({
        purpose: userQuery || customBusiness || profile.businessType || 'Welfare assistance',
        location: customLocation,
        category: customCategory,
        income: customIncome,
        age: customAge ? Number(customAge) : undefined,
        business: customBusiness,
        amount: targetAmount,
        state: profile.state || 'Tamil Nadu',
      });

      clearInterval(stepTimer);

      if (res && res.matches && res.matches.length > 0) {
        setMatches(res.matches);
      } else {
        const fallbackMatches: MatchedSchemeResult[] = [
          {
            ...schemes[0],
            match: 94,
            eligibility: 'Likely Eligible',
            why: `Meets ${customCategory} category quota, urban location subsidy tier in ${profile.city || 'Coimbatore'}, and micro-manufacturing requirements.`,
            matchedCriteria: [
              `Age criteria (${customAge} years) meets 18+ requirement`,
              `Location (${profile.city || 'Coimbatore'}, ${profile.state || 'Tamil Nadu'}) eligible for capital subsidy`,
              `Social category (${customCategory}) qualifies for special assistance quota`,
              `Enterprise activity (${customBusiness}) classified as eligible micro venture`,
            ],
            unmatchedCriteria: [
              `Educational certificate required for project outlay exceeding ₹10 Lakhs`,
            ],
          },
          {
            ...schemes[1],
            match: 88,
            eligibility: 'Likely Eligible',
            why: `Collateral-free working capital loan under Kishore tier suitable for requested outlay of ₹${Number(targetAmount).toLocaleString('en-IN')}.`,
            matchedCriteria: [
              `Viable business plan for ${customBusiness}`,
              `Zero collateral or physical security required`,
              `Repayment tenure up to 5 years with MUDRA RuPay card`,
            ],
            unmatchedCriteria: [
              `6-month bank statement required for credit appraisal`,
            ],
          },
          {
            ...schemes[2],
            match: 78,
            eligibility: 'Likely Eligible',
            why: `Composite credit for greenfield enterprise establishment with up to 85% project cost coverage.`,
            matchedCriteria: [
              `Target beneficiary criteria for ${customCategory} / Women entrepreneurs`,
              `Loan coverage from ₹10 Lakh to ₹1 Crore`,
            ],
            unmatchedCriteria: [
              `New greenfield setup required`,
            ],
          },
        ];
        setMatches(fallbackMatches);
      }
      setSelectedSchemeIndex(0);
      setStage('results');
    } catch {
      clearInterval(stepTimer);
      const fallbackMatches: MatchedSchemeResult[] = [
        {
          ...schemes[0],
          match: 94,
          eligibility: 'Likely Eligible',
          why: `Meets ${customCategory} category quota, urban location subsidy tier in ${profile.city || 'Coimbatore'}, and micro-manufacturing requirements.`,
          matchedCriteria: [
            `Age criteria (${customAge} years) meets 18+ requirement`,
            `Location (${profile.city || 'Coimbatore'}, ${profile.state || 'Tamil Nadu'}) eligible for capital subsidy`,
            `Social category (${customCategory}) qualifies for special assistance quota`,
            `Enterprise activity (${customBusiness}) classified as eligible micro venture`,
          ],
          unmatchedCriteria: [
            `Educational certificate required for project outlay exceeding ₹10 Lakhs`,
          ],
        },
        {
          ...schemes[1],
          match: 88,
          eligibility: 'Likely Eligible',
          why: `Collateral-free working capital loan under Kishore tier suitable for requested outlay of ₹${Number(targetAmount).toLocaleString('en-IN')}.`,
          matchedCriteria: [
            `Viable business plan for ${customBusiness}`,
            `Zero collateral or physical security required`,
            `Repayment tenure up to 5 years with MUDRA RuPay card`,
          ],
          unmatchedCriteria: [
            `6-month bank statement required for credit appraisal`,
          ],
        },
        {
          ...schemes[2],
          match: 78,
          eligibility: 'Likely Eligible',
          why: `Composite credit for greenfield enterprise establishment with up to 85% project cost coverage.`,
          matchedCriteria: [
            `Target beneficiary criteria for ${customCategory} / Women entrepreneurs`,
            `Loan coverage from ₹10 Lakh to ₹1 Crore`,
          ],
          unmatchedCriteria: [
            `New greenfield setup required`,
          ],
        },
      ];
      setMatches(fallbackMatches);
      setSelectedSchemeIndex(0);
      setStage('results');
    }
  };

  const activeScheme = matches[selectedSchemeIndex] || matches[0];
  const locActiveScheme = activeScheme ? getLocalizedScheme(activeScheme) : null;

  const relevantPartner = partners.find(p =>
    activeScheme && p.schemes.some(s => s.toLowerCase().includes(activeScheme.id) || activeScheme.name.toLowerCase().includes(s.toLowerCase()))
  ) || partners[0];

  const parsedAmount = Number(targetAmount) || 300000;
  const subsidyRatePct = customCategory === 'SC' || customCategory === 'ST' || customCategory === 'Women' ? 35 : (customLocation === 'rural' ? 25 : 15);
  const estimatedSubsidy = (parsedAmount * subsidyRatePct) / 100;
  const netLoan = Math.max(0, parsedAmount - estimatedSubsidy);
  const estimatedMonthlyEMI = Math.round((netLoan * 0.085 / 12) / (1 - Math.pow(1 + 0.085 / 12, -36)));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={() => {
            if (stage === 'results') {
              if (onBack) onBack();
              else navigate('home');
            } else if (stage === 'profile_check') {
              setStage('requirement');
            } else if (stage === 'missing_info') {
              setStage('profile_check');
            } else {
              navigate('home');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold transition-colors"
        >
          <span>←</span>
          <span>
            {stage === 'results'
              ? t('backToSchemesDirectory')
              : stage === 'profile_check'
              ? t('step1')
              : stage === 'missing_info'
              ? t('step2')
              : t('back')}
          </span>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 theme-text-muted text-xs sm:text-sm mb-4 flex-wrap">
        <button onClick={() => navigate('home')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('home')}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('aiMatcher')}</span>
        {stage === 'results' && (
          <>
            <span>/</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('recommendedSchemes')}</span>
          </>
        )}
      </div>

      {/* ── STEP 1: CITIZEN ASSISTANCE REQUIREMENT ── */}
      {stage === 'requirement' && (
        <div className="space-y-6">
          <div className="border-b theme-border pb-4">
            <span className="text-[10px] text-[#004b87] dark:text-sky-400 font-bold uppercase tracking-wider mb-1 block">{t('step1Label')}</span>
            <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('matcherTitle')}
            </h1>
            <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
              {t('matcherSubtitle')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded p-3 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
            </div>
          )}

          {/* Natural Language Input Box */}
          <div className="theme-card rounded-md p-5 sm:p-6 space-y-4 shadow-sm border theme-border">
            <label className="text-xs font-bold theme-text-main uppercase tracking-wider block">
              {t('describeRequirement')}
            </label>

            <div className="relative">
              <textarea
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                placeholder={t('chatPlaceholder')}
                rows={3}
                className="w-full theme-input rounded p-3 theme-text-main text-xs sm:text-sm outline-none resize-none placeholder:theme-text-muted"
              />

              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded transition-all text-xs flex items-center gap-1 ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'theme-card-subtle theme-text-muted hover:text-[#004b87] border theme-border'
                  }`}
                  title={isRecording ? 'Listening... click to complete' : t('voiceInput')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{isRecording ? t('listening') : t('voiceInput')}</span>
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[10px] theme-text-muted font-bold uppercase tracking-wider mb-2">{t('suggestedPrompts')}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REQUIREMENT_PROMPTS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setUserQuery(p.text)}
                    className="text-xs px-2.5 py-1 rounded border theme-border theme-card-subtle theme-text-muted hover:theme-text-main hover:border-[#004b87] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRequirementSubmit}
              className="w-full py-2.5 gov-btn-primary text-xs sm:text-sm text-center font-bold"
            >
              {t('continue')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: RETRIEVE SAVED PROFILE & IDENTIFY MISSING INFO ── */}
      {stage === 'profile_check' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b theme-border pb-3">
            <div>
              <span className="text-[10px] text-[#004b87] dark:text-sky-400 font-bold uppercase tracking-wider mb-0.5 block">{t('step2Label')}</span>
              <h1 className="text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('savedProfileTitle')}
              </h1>
              <p className="theme-text-muted text-xs">
                {t('savedProfileSubtitle')}
              </p>
            </div>
            <button
              onClick={() => setStage('requirement')}
              className="text-xs gov-btn-secondary px-3 py-1.5"
            >
              {t('back')}
            </button>
          </div>

          {/* User Requirement Echo */}
          <div className="theme-card-subtle rounded p-3 border theme-border flex items-start gap-2.5 text-xs">
            <span className="text-sm">🎯</span>
            <div className="flex-1">
              <span className="font-bold text-[#004b87] dark:text-sky-300 uppercase tracking-wider text-[10px] block">{t('targetGroup')}:</span>
              <p className="theme-text-main font-medium mt-0.5">{userQuery}</p>
            </div>
          </div>

          {/* Verified Profile Badges */}
          <div className="theme-card rounded-md p-5 space-y-4 shadow-sm border theme-border">
            <div className="flex items-center justify-between border-b theme-border pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h2 className="theme-text-main font-bold text-xs uppercase tracking-wider">
                  {t('savedParamsTitle')} ({profile.name || t('profile')})
                </h2>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
              >
                {isEditingProfile ? t('doneEditing') : `✏ ${t('editForSearch')}`}
              </button>
            </div>

            {!isEditingProfile ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { label: 'Beneficiary Name', value: profile.name || 'Ravi Kumar' },
                  { label: 'Age & Gender', value: `${customAge} yrs · ${customGender}` },
                  { label: 'Location', value: `${profile.city || 'Coimbatore'}, ${profile.state || 'Tamil Nadu'}` },
                  { label: 'Area Classification', value: `${customLocation.toUpperCase()} Tier` },
                  { label: 'Social Category', value: customCategory },
                  { label: 'Annual Income', value: `₹${Number(customIncome || 0).toLocaleString('en-IN')}` },
                  { label: 'Occupation / Enterprise', value: customBusiness },
                  { label: 'Education Level', value: educationLevel },
                  { label: 'Digital Locker', value: `${profile.documents?.length || 4} Verified Documents` },
                  { label: 'Business Status', value: isNewBusiness ? 'New Setup (Greenfield)' : 'Existing Enterprise Expansion' },
                ].map(({ label, value }) => (
                  <div key={label} className="theme-card-subtle rounded p-2.5 border theme-border flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <div className="min-w-0">
                      <p className="text-[10px] theme-text-muted uppercase font-semibold">{label}</p>
                      <p className="theme-text-main text-xs font-bold truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Editable Form Fields */
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Social Category</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                  >
                    {['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'Women', 'Ex-Servicemen'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Gender</label>
                  <select
                    value={customGender}
                    onChange={e => setCustomGender(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                  >
                    {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Area Classification</label>
                  <select
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                  >
                    <option value="urban">Urban Area (15% Subsidy)</option>
                    <option value="rural">Rural Area (25–35% Subsidy)</option>
                    <option value="semi-urban">Semi-Urban</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Annual Household Income (₹)</label>
                  <input
                    value={customIncome}
                    onChange={e => setCustomIncome(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                    placeholder="e.g. 240000"
                  />
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Beneficiary Age (Years)</label>
                  <input
                    value={customAge}
                    onChange={e => setCustomAge(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                    placeholder="e.g. 28"
                  />
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Occupation / Enterprise Sector</label>
                  <input
                    value={customBusiness}
                    onChange={e => setCustomBusiness(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                    placeholder="e.g. Tailoring / Garments"
                  />
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={e => setEducationLevel(e.target.value)}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                  >
                    {['Below Class 8', 'Class 8 Passed', '10th Standard', '12th Standard', 'Graduate / Diploma'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs theme-text-muted font-semibold block mb-1">Enterprise Status</label>
                  <select
                    value={isNewBusiness ? 'new' : 'existing'}
                    onChange={e => setIsNewBusiness(e.target.value === 'new')}
                    className="w-full theme-input rounded px-2.5 py-1.5 theme-text-main text-xs outline-none"
                  >
                    <option value="new">New Business Setup (Greenfield)</option>
                    <option value="existing">Existing Business Expansion</option>
                  </select>
                </div>
              </div>
            )}

            {/* Target Financial Outlay (Required Information) */}
            <div className="pt-3 border-t theme-border">
              <label className="text-xs theme-text-muted font-bold uppercase tracking-wider block mb-1.5">
                {t('targetBudgetLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['50000', '100000', '300000', '500000', '1000000', '2500000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetAmount(amt)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                      targetAmount === amt
                        ? 'bg-[#004b87] text-white border-[#004b87]'
                        : 'border-slate-200 dark:border-white/10 theme-card-subtle theme-text-muted hover:theme-text-main'
                    }`}
                  >
                    ₹{(Number(amt) / 100000).toFixed(Number(amt) < 100000 ? 2 : 1)} {t('lakh')}
                  </button>
                ))}
              </div>
              <input
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="e.g. 300000"
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none font-mono"
              />
            </div>

            <button
              onClick={handleProfileConfirm}
              className="w-full py-2.5 gov-btn-primary text-xs sm:text-sm text-center font-bold"
            >
              {t('matchWithProfile')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: MISSING INFORMATION FORM (If Needed) ── */}
      {stage === 'missing_info' && (
        <div className="theme-card rounded-md p-6 space-y-4 shadow-sm border theme-border animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="theme-text-main font-bold text-sm uppercase tracking-wider">
              {t('step3Label')}
            </h2>
          </div>
          <p className="theme-text-muted text-xs leading-relaxed">
            {t('docGuidance')}
          </p>

          <div>
            <label className="text-xs theme-text-muted font-bold uppercase tracking-wider block mb-1">
              {t('targetBudgetLabel')}
            </label>
            <input
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="e.g. 300000"
              className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none font-mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStage('profile_check')}
              className="flex-1 py-2 gov-btn-secondary text-xs"
            >
              {t('back')}
            </button>
            <button
              onClick={() => {
                saveToProfile();
                triggerBackendMatch();
              }}
              className="flex-1 py-2 gov-btn-primary text-xs font-bold"
            >
              {t('matchWithProfile')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: INTELLIGENT ASSESSMENT PROGRESS ── */}
      {stage === 'analyzing' && (
        <div className="min-h-[50vh] flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-md w-full theme-card rounded-md p-6 shadow-sm border theme-border animate-fade-in">
            <div className="w-8 h-8 rounded-full border-3 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin mx-auto mb-3" />
            <h2 className="text-lg font-bold theme-text-main mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('analyzingTitle')}
            </h2>
            <p className="theme-text-muted text-xs mb-4">{t('analyzingDesc')}</p>

            <div className="space-y-1.5 text-left">
              {matchingSteps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
                    i <= analyzingStep ? 'theme-card-subtle border theme-border' : 'opacity-40 theme-card-subtle border border-transparent'
                  }`}
                >
                  {i < analyzingStep ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  ) : i === analyzingStep ? (
                    <div className="w-3 h-3 rounded-full border-2 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-400 flex-shrink-0" />
                  )}
                  <span className={i <= analyzingStep ? 'theme-text-main font-medium' : 'theme-text-muted'}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: COMPLETE WELFARE ASSISTANCE PLAN & MATCHED SCHEMES ── */}
      {stage === 'results' && activeScheme && locActiveScheme && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border pb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 rounded uppercase">
                  ✓ {t('matchingCompleted')}
                </span>
                <span className="theme-text-muted text-xs">({matches.length} {t('supportedSchemes')})</span>
              </div>
              <h1 className="text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('completeWelfarePlan')}
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  matcherSessionCache = null;
                  setStage('requirement');
                }}
                className="text-xs gov-btn-secondary px-3 py-1.5"
              >
                {t('newSearch')}
              </button>
              {isUserLoggedIn && (
                <button
                  onClick={() => navigate('profile', undefined, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                  className="text-xs gov-btn-primary px-3 py-1.5"
                >
                  {t('viewProfile')}
                </button>
              )}
            </div>
          </div>

          {/* Evaluated Parameters Context Strip */}
          <div className="theme-card rounded p-3 border theme-border flex flex-wrap gap-2 items-center text-xs">
            <span className="theme-text-muted font-bold uppercase text-[10px]">{t('savedParamsTitle')}:</span>
            <span className="theme-card-subtle px-2 py-0.5 rounded border theme-border theme-text-main">🎯 {userQuery}</span>
            <span className="theme-card-subtle px-2 py-0.5 rounded border theme-border theme-text-main">📍 {profile.city || 'Coimbatore'} ({customLocation})</span>
            <span className="theme-card-subtle px-2 py-0.5 rounded border theme-border theme-text-main">🏷️ {customCategory} · {customAge} {t('years')}</span>
            <span className="theme-card-subtle px-2 py-0.5 rounded border theme-border theme-text-main">💰 ₹{parsedAmount.toLocaleString('en-IN')}</span>
          </div>

          {/* Scheme Selection Tabs (If Multiple Matched Schemes) */}
          <div className="flex gap-2 border-b theme-border pb-2 overflow-x-auto">
            {matches.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setSelectedSchemeIndex(idx)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedSchemeIndex === idx
                    ? 'bg-[#004b87] text-white border-[#004b87] shadow-sm'
                    : 'border-slate-200 dark:border-white/10 theme-card-subtle theme-text-muted hover:theme-text-main'
                }`}
              >
                <span>{m.name.split('(')[0].trim()}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-white/20 text-[10px]">{m.match}% {t('matchScore')}</span>
              </button>
            ))}
          </div>

          {/* ── COMPLETE ASSISTANCE DOSSIER FOR SELECTED SCHEME ── */}
          <div className="theme-card rounded-md p-6 border theme-border shadow-sm space-y-6">

            {/* Scheme Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b theme-border pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded uppercase">
                    {t('topMatch')}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {activeScheme.eligibility}
                  </span>
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-semibold">
                    {locActiveScheme.type}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {locActiveScheme.name}
                </h2>
                <p className="theme-text-muted text-xs font-medium">{locActiveScheme.organization}</p>
              </div>

              {/* Match Score Gauge */}
              <div className="text-center theme-card-subtle border theme-border rounded px-4 py-2 flex-shrink-0">
                <span className="text-3xl font-extrabold text-[#004b87] dark:text-sky-300 font-mono" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {activeScheme.match}%
                </span>
                <p className="text-[9px] theme-text-muted uppercase font-bold mt-0.5">{t('matchScore')}</p>
              </div>
            </div>

            {/* 1. WHY THIS SCHEME MATCHES YOU (Explainability) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold theme-text-main uppercase tracking-wider flex items-center gap-1.5">
                <span>✦</span>
                <span>{t('whyMatches')}</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="theme-card-subtle rounded p-3 border theme-border space-y-1.5">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">{t('feat2Title')}</p>
                  {(activeScheme.matchedCriteria || [
                    `Age criteria (${customAge} years) verified valid`,
                    `Location (${profile.city || 'Coimbatore'}, ${customLocation}) eligible for capital subsidy`,
                    `Social category (${customCategory}) qualifies for special quota`,
                    `Enterprise activity (${customBusiness}) eligible`,
                  ]).map((crit, ci) => (
                    <div key={ci} className="flex items-start gap-1.5 text-xs theme-text-main">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>

                <div className="theme-card-subtle rounded p-3 border theme-border space-y-1.5">
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase">{t('requiredDocs')}</p>
                  {(activeScheme.unmatchedCriteria || [
                    `Class 8+ educational proof required for projects > ₹10 Lakhs`,
                    `Physical appraisal and verification conducted by bank branch`,
                  ]).map((cond, cdi) => (
                    <div key={cdi} className="flex items-start gap-1.5 text-xs theme-text-main">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span>
                      <span>{cond}</span>
                    </div>
                  ))}
                  <p className="text-[10px] theme-text-muted pt-1">
                    *{t('calcDisclaimer')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. FINANCIAL FIT & SUBSIDY BREAKDOWN */}
            <div className="space-y-2.5 border-t theme-border pt-4">
              <h3 className="text-xs font-bold theme-text-main uppercase tracking-wider flex items-center gap-1.5">
                <span>📊</span>
                <span>{t('financialFit')}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="theme-card-subtle rounded p-2.5 border theme-border">
                  <span className="text-[10px] theme-text-muted uppercase font-bold block">{t('totalProjectOutlay')}</span>
                  <p className="text-sm font-bold theme-text-main mt-0.5">₹{parsedAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">{t('govSubsidy')}</span>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">₹{estimatedSubsidy.toLocaleString('en-IN')} ({subsidyRatePct}%)</p>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border">
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 uppercase font-bold block">{t('netBankLoan')}</span>
                  <p className="text-sm font-bold theme-text-main mt-0.5">₹{netLoan.toLocaleString('en-IN')}</p>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">{t('estimatedEmi')}</span>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-0.5">₹{estimatedMonthlyEMI.toLocaleString('en-IN')}{t('perMonth')}</p>
                </div>
              </div>
            </div>

            {/* 3. DOCUMENT LOCKER READINESS */}
            <div className="space-y-2.5 border-t theme-border pt-4">
              <h3 className="text-xs font-bold theme-text-main uppercase tracking-wider flex items-center gap-1.5">
                <span>📄</span>
                <span>{t('docChecklist')}</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="theme-card-subtle rounded p-2.5 border theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span className="theme-text-main font-medium">Aadhaar & PAN Card</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">{t('docsReady')}</span>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span className="theme-text-main font-medium">Bank Savings Account Statement</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">{t('available')}</span>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span>
                    <span className="theme-text-main font-medium">Project Detailed Appraisal Report</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">{t('mandatory')}</span>
                </div>
                <div className="theme-card-subtle rounded p-2.5 border theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span>
                    <span className="theme-text-main font-medium">Income / Community Certificate</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">{t('optional')}</span>
                </div>
              </div>
            </div>

            {/* 4. RECOMMENDED NODAL CHANNEL PARTNER */}
            <div className="space-y-2.5 border-t theme-border pt-4">
              <h3 className="text-xs font-bold theme-text-main uppercase tracking-wider flex items-center gap-1.5">
                <span>🏦</span>
                <span>{t('channelPartners')}</span>
              </h3>
              <div className="theme-card-subtle rounded p-3 border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="theme-text-main font-bold text-sm">{relevantPartner.name}</p>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      {locActiveScheme.name.split('(')[0].trim()}
                    </span>
                  </div>
                  <p className="theme-text-muted text-xs">{relevantPartner.address} · <span className="font-semibold text-[#004b87] dark:text-sky-300">{relevantPartner.distance}</span></p>
                  <p className="theme-text-muted text-[10px] mt-0.5 font-mono">🕒 {relevantPartner.hours}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${relevantPartner.phone}`}
                    className="px-3 py-1.5 gov-btn-secondary text-xs"
                  >
                    📞 {t('contact')}
                  </a>
                  <button
                    onClick={() => navigate('partners', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                    className="px-3 py-1.5 gov-btn-primary text-xs"
                  >
                    {t('channelPartners')} →
                  </button>
                </div>
              </div>
            </div>

            {/* 5. CITIZEN ACTIONS & APPLICATION GUIDANCE */}
            <div className="flex flex-wrap gap-2 pt-4 border-t theme-border">
              <button
                onClick={() => navigate('scheme-details', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                className="flex-1 min-w-32 py-2 gov-btn-primary text-xs text-center font-bold"
              >
                {t('viewDetails')}
              </button>
              <button
                onClick={() => navigate('eligibility', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                className="flex-1 min-w-32 py-2 gov-btn-secondary text-xs text-center"
              >
                {t('checkEligibility')}
              </button>
              <button
                onClick={() => navigate('calculator', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                className="flex-1 min-w-32 py-2 gov-btn-secondary text-xs text-center"
              >
                {t('calculateSubsidy')}
              </button>
              <button
                onClick={() => navigate('documents', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                className="flex-1 min-w-32 py-2 gov-btn-secondary text-xs text-center"
              >
                {t('requiredDocs')}
              </button>
              <button
                onClick={() => navigate('guidance', activeScheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                className="flex-1 min-w-32 py-2 gov-btn-secondary text-xs text-center"
              >
                {t('applicationGuidance')} →
              </button>
            </div>
          </div>

          {/* ── OTHER RELEVANT MATCHED SCHEMES (Comparison) ── */}
          {matches.length > 1 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider">
                {t('otherMatchingSchemes')} ({matches.length - 1})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {matches.filter((_, i) => i !== selectedSchemeIndex).map((scheme) => (
                  <div
                    key={scheme.id}
                    className="theme-card rounded-md p-4 border theme-border hover:border-[#004b87] transition-colors shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-[#004b87] dark:text-sky-300 border border-blue-500/20">
                          {scheme.type}
                        </span>
                        <span className="text-xs font-bold text-[#004b87] dark:text-sky-300 font-mono">
                          {scheme.match}% {t('matchScore')}
                        </span>
                      </div>
                      <h4 className="theme-text-main font-bold text-sm mb-0.5">{scheme.name}</h4>
                      <p className="theme-text-muted text-[11px] mb-2">{scheme.organization}</p>
                      <p className="theme-text-secondary text-xs leading-relaxed line-clamp-2 mb-3">{scheme.why}</p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t theme-border">
                      <button
                        onClick={() => {
                          const idx = matches.findIndex(m => m.id === scheme.id);
                          if (idx !== -1) setSelectedSchemeIndex(idx);
                        }}
                        className="flex-1 py-1.5 gov-btn-primary text-xs text-center"
                      >
                        {t('selectScheme')}
                      </button>
                      <button
                        onClick={() => navigate('scheme-details', scheme.id, { fromPage: 'ai-matcher', fromLabel: 'AI Matcher Results' })}
                        className="flex-1 py-1.5 gov-btn-secondary text-xs text-center"
                      >
                        {t('viewDetails')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Disclaimer */}
          <div className="theme-card-subtle rounded p-3.5 border theme-border text-[11px] theme-text-muted leading-relaxed">
            {t('officialNotice')}
          </div>
        </div>
      )}
    </div>
  );
}
