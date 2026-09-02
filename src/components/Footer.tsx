import type { Page } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  navigate: (page: Page, schemeId?: string) => void;
}

export default function Footer({ navigate }: Props) {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#001f3f] text-slate-300 border-t border-[#001830] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand & Portal Purpose */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded bg-[#0284c7] flex items-center justify-center font-bold text-white text-sm">
                S
              </div>
              <span className="text-white font-bold text-base" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              {t('portalFooterTag')}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              National Digital Public Infrastructure Initiative
            </p>
          </div>

          {/* Citizen Services */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('citizenServices')}</h4>
            <ul className="space-y-2 text-xs">
              {[
                ['Government Schemes Directory', 'catalog'],
                ['AI Scheme Matcher', 'ai-matcher'],
                ['Eligibility Evaluation', 'eligibility'],
                ['Financial Subsidy Calculator', 'calculator'],
                ['Required Documents Locker', 'documents'],
                ['Authorized Bank Partners', 'partners'],
              ].map(([label, page]) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page as Page)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Welfare Schemes */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('popularSchemes')}</h4>
            <ul className="space-y-2 text-xs">
              {[
                ['PMEGP (Micro Enterprise Subsidy)', 'pmegp'],
                ['Pradhan Mantri MUDRA Yojana', 'mudra'],
                ['Stand-Up India Scheme', 'standup'],
                ['DAY-NULM (Urban Livelihoods)', 'nulm'],
                ['Pradhan Mantri Awas Yojana', 'pmay'],
                ['PM SVANidhi (Street Vendors)', 'svamitva'],
              ].map(([label, id]) => (
                <li key={id}>
                  <button
                    onClick={() => navigate('scheme-details', id)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Helpline */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('citizenSupport')}</h4>
            <ul className="space-y-2 text-xs mb-4">
              {[
                ['Application Guidance & Roadmap', 'guidance'],
                ['Frequently Asked Questions', 'faq'],
                ['Beneficiary Welfare Profile', 'profile'],
                ['AI Consultation History', 'conversations'],
              ].map(([label, page]) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page as Page)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="bg-[#002b54] border border-white/10 rounded-md p-3 text-slate-300">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">{t('tollFree')}</p>
              <p className="text-white font-bold text-sm tracking-wide mt-0.5">1800-11-2024</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('timings')}</p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Portals Reference */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>
            {t('disclaimerText')}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => navigate('faq')} className="hover:text-white transition-colors">{t('privacyPolicy')}</button>
            <span>•</span>
            <button onClick={() => navigate('faq')} className="hover:text-white transition-colors">{t('termsOfService')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
