import { useState, useRef, useEffect } from 'react';
import type { NavProps } from '../types';

interface Props extends NavProps {
  isLoggedIn: boolean;
}

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

const navLinks = [
  { label: 'Schemes', page: 'catalog' as const },
  { label: 'AI Matcher', page: 'ai-matcher' as const },
  { label: 'Calculator', page: 'calculator' as const },
  { label: 'Partners', page: 'partners' as const },
  { label: 'Help', page: 'faq' as const },
];

export default function Navbar({ navigate, currentPage, isLoggedIn }: Props) {
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(languages[0]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectLang = (lang: typeof languages[0]) => {
    setActiveLang(lang);
    setLangOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0b1629]/95 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4" style={{ height: '60px' }}>

          {/* Logo */}
          <button onClick={() => navigate('home')} className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
              <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
            </div>
            <div className="leading-none">
              <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya</span>
              <span className="text-[10px] text-amber-400 font-semibold ml-1.5 bg-amber-400/10 px-1.5 py-0.5 rounded align-middle">AI</span>
            </div>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium">{activeLang.native}</span>
                <svg className={`w-3 h-3 text-slate-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1f3d] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-white/8">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Select Language</p>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => selectLang(lang)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${activeLang.code === lang.code ? 'text-blue-400' : 'text-slate-300'}`}
                    >
                      <span className="font-medium">{lang.native}</span>
                      <span className="text-xs text-slate-500">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth buttons */}
            {isLoggedIn ? (
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-white/10 hover:border-white/20"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center">
                  <span className="text-blue-300 text-xs font-bold">RK</span>
                </div>
                <span className="hidden sm:block text-slate-300 text-sm font-medium">Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('login')}
                  className="hidden sm:block text-sm text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('login')}
                  className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md shadow-blue-600/25 hover:shadow-blue-500/30"
                >
                  Get Started
                </button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/8 bg-[#0a1526]">
            {!isLoggedIn && (
              <div className="px-4 py-4 flex gap-2">
                <button onClick={() => { navigate('login'); setMobileOpen(false); }} className="flex-1 text-sm text-center border border-white/15 text-slate-300 px-4 py-2.5 rounded-lg hover:bg-white/5 font-medium">Login</button>
                <button onClick={() => { navigate('login'); setMobileOpen(false); }} className="flex-1 text-sm text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold">Get Started</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
