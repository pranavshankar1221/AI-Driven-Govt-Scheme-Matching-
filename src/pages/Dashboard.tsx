import type { NavProps } from '../types';
import { schemes } from '../data/schemes';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({ navigate, onBack }: NavProps) {
  const { profile } = useProfile();
  const { t, getLocalizedSchemes } = useLanguage();

  const locSchemes = getLocalizedSchemes(schemes);

  const recentConversations = [
    { title: 'Tailoring business loan enquiry', date: '2 hours ago', preview: 'Found 3 matching schemes — PMEGP, MUDRA, Stand-Up India' },
    { title: 'MUDRA eligibility check', date: 'Yesterday', preview: 'Eligible. 2 documents pending verification.' },
    { title: 'EMI calculation for ₹3L loan', date: '3 days ago', preview: 'EMI: ₹7,052/month with 25% PMEGP subsidy' },
  ];

  const userInitials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : 'RK';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
        <span className="theme-text-main font-semibold">{t('dashboard')}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b theme-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('dashboard')}
          </h1>
          <p className="theme-text-muted text-xs sm:text-sm mt-0.5">{profile.name || 'Citizen'} · {t('portalName')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('profile', undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
            className="px-3.5 py-2 gov-btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>👤 {t('myProfile')}</span>
          </button>
          <button
            onClick={() => navigate('ai-matcher', undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
            className="px-3.5 py-2 gov-btn-primary text-xs flex items-center gap-1.5"
          >
            <span>{t('matchUsingAi')}</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="theme-card rounded-lg p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center border theme-border shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-[#004b87] text-white flex items-center justify-center flex-shrink-0 font-extrabold text-lg shadow-sm">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-base font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {profile.name || 'Citizen'}
            </h2>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded font-semibold uppercase">
              {t('docsReady')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs theme-text-muted">
            <span>{profile.city || 'Coimbatore'}, {profile.state || 'Tamil Nadu'}</span>
            <span>•</span>
            <span>{t('beneficiaryCategory')}: {profile.category || 'OBC'}</span>
            <span>•</span>
            <span>{t('annualIncome')}: ₹{Number(profile.annualIncome || 240000).toLocaleString('en-IN')}/{t('years')}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('profile', undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
          className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
        >
          {t('myProfile')} →
        </button>
      </div>

      {/* Quick Access Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: t('aiMatcher'), desc: t('feat1Desc'), page: 'ai-matcher' as const, icon: '✦', badge: 'AI Powered' },
          { title: t('schemes'), desc: t('catalogSubtitle'), page: 'catalog' as const, icon: '📂', badge: '500+ Schemes' },
          { title: t('channelPartners'), desc: t('feat5Desc'), page: 'partners' as const, icon: '🏦', badge: 'Accredited' },
          { title: t('myProfile'), desc: t('savedProfileSubtitle'), page: 'profile' as const, icon: '📄', badge: 'Locker Ready' },
        ].map(item => (
          <div
            key={item.title}
            onClick={() => navigate(item.page, undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
            className="theme-card theme-card-hover rounded-lg p-5 transition-all cursor-pointer border theme-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] theme-text-muted font-semibold theme-card-subtle px-2 py-0.5 rounded border theme-border">
                  {item.badge}
                </span>
              </div>
              <h3 className="theme-text-main font-bold text-sm mb-1">{item.title}</h3>
              <p className="theme-text-muted text-xs leading-relaxed">{item.desc}</p>
            </div>
            <p className="text-xs text-[#004b87] dark:text-sky-300 font-semibold mt-3 flex items-center gap-1">
              <span>{t('viewDetails')}</span>
              <span>→</span>
            </p>
          </div>
        ))}
      </div>

      {/* Recommended Schemes for User */}
      <div className="theme-card rounded-lg p-5 mb-6 border theme-border shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b theme-border pb-2.5">
          <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('recommendedSchemes')}
          </h2>
          <button
            onClick={() => navigate('catalog', undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
            className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
          >
            {t('browseAllSchemes')} →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {locSchemes.slice(0, 3).map((scheme, i) => (
            <div key={scheme.id} className="theme-card-subtle rounded-lg p-4 border theme-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded font-semibold">
                    {scheme.type}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    {95 - i * 6}% {t('matchScore')}
                  </span>
                </div>
                <h4 className="theme-text-main font-bold text-xs sm:text-sm mb-0.5">{scheme.name}</h4>
                <p className="theme-text-muted text-[10px] line-clamp-1 mb-2">{scheme.organization}</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold mb-3">{scheme.financialAssistance}</p>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => navigate('scheme-details', scheme.id, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
                  className="flex-1 py-1.5 gov-btn-primary text-center text-[11px]"
                >
                  {t('viewScheme')}
                </button>
                <button
                  onClick={() => navigate('eligibility', scheme.id, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
                  className="flex-1 py-1.5 gov-btn-secondary text-center text-[11px]"
                >
                  {t('checkEligibility')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Consultation History */}
      <div className="theme-card rounded-lg p-5 border theme-border shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b theme-border pb-2.5">
          <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('chatHistory')}
          </h2>
          <button
            onClick={() => navigate('conversations', undefined, { fromPage: 'dashboard', fromLabel: 'Dashboard' })}
            className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
          >
            {t('viewDetails')} →
          </button>
        </div>

        <div className="space-y-2">
          {recentConversations.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg theme-card-subtle border theme-border text-xs">
              <div>
                <p className="theme-text-main font-semibold">{c.title}</p>
                <p className="theme-text-muted text-[11px] mt-0.5">{c.preview}</p>
              </div>
              <span className="theme-text-muted text-[10px] whitespace-nowrap">{c.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
