import { useState, useRef, useEffect } from 'react';
import type { NavProps, Page } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  isLoggedIn: boolean;
  onLogout?: () => void;
  onAIOpen?: () => void;
  onCallOpen?: () => void;
}

export default function Navbar({ navigate, currentPage, isLoggedIn, onLogout, onAIOpen }: Props) {
  const { isDark, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const { currentLanguage, languages, setLanguage, t } = useLanguage();

  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks: { label: string; page: Page }[] = [
    { label: t('schemes'), page: 'catalog' },
    { label: t('aiMatcher'), page: 'ai-matcher' },
    { label: t('help'), page: 'faq' },
  ];

  const userInitials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : 'RK';

  const displayName = profile.name ? profile.name.split(' ')[0] : 'Citizen';

  const handleLogoutClick = () => {
    setProfileOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Main Topmost Navigation Bar */}
      <nav className="bg-[#003366] text-white border-b border-[#002244]">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-16 relative">

          {/* Left Zone: Sahaya Brand (NO Home icon when logged in) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Leftmost Home Icon: ONLY on logged-out landing page */}
            {!isLoggedIn && (
              <button
                onClick={() => navigate('home')}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 'home'
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
                title={t('home')}
                aria-label={t('home')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            )}

            {/* Brand Logo & Name */}
            <button
              onClick={() => navigate(isLoggedIn ? 'catalog' : 'home')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
              aria-label="Sahaya Portal"
            >
              <div className="w-8 h-8 rounded-md bg-[#0284c7] flex items-center justify-center font-bold text-white text-base shadow-sm border border-white/20">
                S
              </div>
              <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Sahaya
              </span>
            </button>
          </div>

          {/* Center Zone: Main Navigation Links (Visually centered on desktop when logged in) */}
          {isLoggedIn && (
            <div className="hidden lg:flex items-center justify-center gap-1.5 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const isActive = currentPage === link.page;
                return (
                  <button
                    key={link.page}
                    onClick={() => navigate(link.page)}
                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/15 text-white font-semibold shadow-inner'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right Zone: Right-side Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 ml-auto">

            {/* Ask AI Assistant Button: ONLY visible when logged in */}
            {isLoggedIn && onAIOpen && (
              <button
                onClick={onAIOpen}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white border border-white/20 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                title="Ask Sahaya AI Assistant"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('askAi')}</span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-white font-medium"
                aria-label={t('selectLanguage')}
              >
                <span>🌐</span>
                <span className="hidden sm:inline font-semibold">{currentLanguage.native}</span>
                <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 max-h-80 overflow-y-auto bg-white dark:bg-[#0d223f] text-slate-900 dark:text-white rounded-md shadow-xl z-50 border border-slate-200 dark:border-white/15">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20 sticky top-0">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('selectLanguage')}</p>
                  </div>
                  <div className="py-1">
                    {languages.map((lang) => {
                      const displayText = lang.code === 'en' ? 'English' : `${lang.native} - ${lang.label}`;
                      const isSelected = currentLanguage.code === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setLangOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-white/10 ${
                            isSelected
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/30'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-medium text-left">{displayText}</span>
                          {isSelected && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-white"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown (Logged In) OR Sign In Button (Logged Out) */}
            {isLoggedIn ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-white font-medium"
                  aria-label="User Profile Menu"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0284c7] flex items-center justify-center text-white text-[10px] font-bold">
                    {userInitials}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold">{displayName}</span>
                  <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#0d223f] text-slate-900 dark:text-white rounded-md shadow-xl overflow-hidden z-50 border border-slate-200 dark:border-white/15 animate-fade-in">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20">
                      <p className="text-xs font-bold truncate">{profile.name || 'Ravi Kumar'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{profile.occupation || 'Welfare Beneficiary'}</p>
                    </div>
                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('profile');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        <span>👤</span>
                        <span>{t('myProfile')}</span>
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-medium border-t border-slate-100 dark:border-white/10"
                      >
                        <span>🚪</span>
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t('signIn')}</span>
              </button>
            )}

            {/* Mobile Menu Button (Only needed when logged in) */}
            {isLoggedIn && (
              <button
                className="lg:hidden text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer: ONLY when logged in */}
        {isLoggedIn && mobileOpen && (
          <div className="lg:hidden border-t border-[#002244] bg-[#002b54] px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => {
                    navigate(link.page);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white font-semibold' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            <button
              onClick={() => {
                navigate('profile');
                setMobileOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'profile' ? 'bg-white/15 text-white font-semibold' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              👤 {t('myProfile')}
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogoutClick();
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-white/10"
            >
              🚪 {t('logout')}
            </button>

            {onAIOpen && (
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onAIOpen();
                  }}
                  className="w-full text-center bg-[#0284c7] text-white px-3 py-2 rounded-md text-xs font-semibold"
                >
                  ✦ {t('askAi')}
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
