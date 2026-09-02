import type { Page } from '../types';

interface Props {
  navigate: (page: Page, schemeId?: string) => void;
}

export default function Footer({ navigate }: Props) {
  return (
    <footer className="bg-[#060e1d] border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
              </div>
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya</span>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              AI-powered government welfare platform helping beneficiaries discover, check eligibility, and apply for schemes.
            </p>
            <div className="flex gap-2">
              {['𝕏', 'f', '▶', 'in'].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-white text-xs font-bold">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                ['Scheme Catalog', 'catalog'],
                ['AI Matcher', 'ai-matcher'],
                ['Eligibility Check', 'eligibility'],
                ['Financial Calculator', 'calculator'],
                ['Required Documents', 'documents'],
                ['Partner Locator', 'partners'],
              ].map(([label, page]) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page as Page)}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Schemes */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Popular Schemes</h4>
            <ul className="space-y-2.5">
              {[
                ['PMEGP', 'pmegp'],
                ['MUDRA Yojana', 'mudra'],
                ['Stand-Up India', 'standup'],
                ['NULM', 'nulm'],
                ['PM Awas Yojana', 'pmay'],
                ['PM SVANidhi', 'svamitva'],
              ].map(([label, id]) => (
                <li key={id}>
                  <button
                    onClick={() => navigate('scheme-details', id)}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 mb-6">
              {[
                ['Help & FAQs', 'faq'],
                ['Application Guidance', 'guidance'],
                ['Dashboard', 'dashboard'],
                ['Conversation History', 'conversations'],
                ['Login / Sign Up', 'login'],
              ].map(([label, page]) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page as Page)}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="bg-[#0f1f3d] border border-white/8 rounded-xl p-4">
              <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wide font-medium">Helpline</p>
              <p className="text-white font-bold text-base mb-0.5">1800-XXX-XXXX</p>
              <p className="text-[11px] text-slate-500">Toll-free · Mon–Sat, 9 AM – 6 PM</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">
            © 2024 Sahaya. Empowering beneficiaries through AI-guided government scheme access.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">Privacy Policy</span>
            <span className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">Terms of Use</span>
            <span className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
