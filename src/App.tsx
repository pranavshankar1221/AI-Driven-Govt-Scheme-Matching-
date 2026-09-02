import { useState } from 'react';
import type { Page } from './types';
import { schemes } from './data/schemes';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import AIAssistant from './components/AIAssistant';
import VoiceCall from './components/VoiceCall';

import Home from './pages/Home';
import SchemesCatalog from './pages/SchemesCatalog';
import SchemeDetails from './pages/SchemeDetails';
import AIMatcher from './pages/AIMatcher';
import EligibilityResults from './pages/EligibilityResults';
import FinancialCalculator from './pages/FinancialCalculator';
import RequiredDocuments from './pages/RequiredDocuments';
import PartnerLocator from './pages/PartnerLocator';
import ApplicationGuidance from './pages/ApplicationGuidance';
import Dashboard from './pages/Dashboard';
import ConversationHistory from './pages/ConversationHistory';
import HelpFAQ from './pages/HelpFAQ';
import LoginSignup from './pages/LoginSignup';
import Profile from './pages/Profile';

interface HistoryEntry {
  page: Page;
  schemeId?: string;
  label?: string;
}

const getStoredAuth = (): boolean => {
  try {
    return localStorage.getItem('sahaya_is_logged_in') === 'true';
  } catch {
    return false;
  }
};

const getStoredPage = (authenticated: boolean): Page => {
  if (!authenticated) {
    try {
      const saved = sessionStorage.getItem('sahaya_current_page') as Page;
      if (saved === 'login') return 'login';
    } catch {
      // ignore
    }
    return 'home';
  }

  // If authenticated, NEVER return 'home' or 'login'
  try {
    const saved = sessionStorage.getItem('sahaya_current_page') as Page;
    if (saved && saved !== 'home' && saved !== 'login') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'catalog';
};

const getStoredSchemeId = (): string => {
  try {
    const saved = sessionStorage.getItem('sahaya_selected_scheme');
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'pmegp';
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getStoredAuth());
  const [currentPage, setCurrentPage] = useState<Page>(() => getStoredPage(getStoredAuth()));
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(() => getStoredSchemeId());
  const [intendedDestination, setIntendedDestination] = useState<{ page: Page; schemeId?: string } | null>(null);
  const [pageHistory, setPageHistory] = useState<HistoryEntry[]>(() => {
    const auth = getStoredAuth();
    const initPage = getStoredPage(auth);
    return [{ page: initPage, label: initPage === 'home' ? 'Home' : initPage === 'catalog' ? 'Schemes' : undefined }];
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  const navigate = (
    page: Page,
    schemeId?: string,
    sourceContext?: { fromPage?: Page; fromLabel?: string }
  ) => {
    // If user is logged in and attempts to navigate to 'home' or 'login', redirect to 'catalog'
    if (isLoggedIn && (page === 'home' || page === 'login')) {
      page = 'catalog';
    }

    // If user is not logged in and attempts to access protected page
    if (!isLoggedIn && page !== 'home' && page !== 'login') {
      setIntendedDestination({ page, schemeId });
      if (schemeId) {
        setSelectedSchemeId(schemeId);
        try { sessionStorage.setItem('sahaya_selected_scheme', schemeId); } catch {}
      }
      setCurrentPage('login');
      try { sessionStorage.setItem('sahaya_current_page', 'login'); } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const effectiveSchemeId = schemeId || selectedSchemeId;
    if (schemeId) {
      setSelectedSchemeId(schemeId);
      try { sessionStorage.setItem('sahaya_selected_scheme', schemeId); } catch {}
    }

    try { sessionStorage.setItem('sahaya_current_page', page); } catch {}

    if (page === 'home') {
      setPageHistory([{ page: 'home', label: 'Home' }]);
    } else {
      setPageHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].page === page) {
          return prev;
        }
        return [
          ...prev,
          {
            page,
            schemeId: effectiveSchemeId,
            label: sourceContext?.fromLabel,
          },
        ];
      });
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = pageHistory.slice(0, pageHistory.length - 1);
      const target = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      if (target.schemeId) {
        setSelectedSchemeId(target.schemeId);
        try { sessionStorage.setItem('sahaya_selected_scheme', target.schemeId); } catch {}
      }
      setCurrentPage(target.page);
      try { sessionStorage.setItem('sahaya_current_page', target.page); } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(isLoggedIn ? 'catalog' : 'home');
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem('sahaya_is_logged_in', 'true');
    } catch {
      // ignore
    }

    if (intendedDestination && intendedDestination.page !== 'home' && intendedDestination.page !== 'login') {
      const dest = intendedDestination;
      setIntendedDestination(null);
      if (dest.schemeId) {
        setSelectedSchemeId(dest.schemeId);
        try { sessionStorage.setItem('sahaya_selected_scheme', dest.schemeId); } catch {}
      }
      setCurrentPage(dest.page);
      try { sessionStorage.setItem('sahaya_current_page', dest.page); } catch {}
      setPageHistory([
        { page: 'catalog', label: 'Schemes' },
        { page: dest.page, schemeId: dest.schemeId },
      ]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIntendedDestination(null);
      setPageHistory([
        { page: 'catalog', label: 'Schemes' },
      ]);
      setCurrentPage('catalog');
      try { sessionStorage.setItem('sahaya_current_page', 'catalog'); } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIntendedDestination(null);
    setPageHistory([{ page: 'home', label: 'Home' }]);
    try {
      localStorage.setItem('sahaya_is_logged_in', 'false');
      sessionStorage.removeItem('sahaya_current_page');
    } catch {
      // ignore
    }
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAIOpen = () => {
    if (!isLoggedIn) {
      setIntendedDestination({ page: 'ai-matcher' });
      navigate('login');
      return;
    }
    setAiOpen(true);
  };

  const handleCallOpen = () => {
    if (!isLoggedIn) {
      setIntendedDestination({ page: 'ai-matcher' });
      navigate('login');
      return;
    }
    setCallOpen(true);
  };

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId) ?? schemes[0];

  const previousHistoryEntry = pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : undefined;
  const previousPage = previousHistoryEntry?.page;
  const previousLabel = previousHistoryEntry?.label;

  const navProps = {
    navigate,
    currentPage,
    previousPage,
    previousLabel,
    onBack: handleBack,
    fromPage: previousPage,
    fromLabel: previousLabel,
    selectedSchemeId,
  };

  // When on login page and not logged in, show ONLY the centered Login/Register form
  if (currentPage === 'login' && !isLoggedIn) {
    return (
      <ThemeProvider>
        <ProfileProvider>
          <LanguageProvider>
            <div className="min-h-screen flex items-center justify-center theme-page">
              <LoginSignup {...navProps} onLogin={handleLogin} />
            </div>
          </LanguageProvider>
        </ProfileProvider>
      </ThemeProvider>
    );
  }

  const renderPage = () => {
    const pageToRender = isLoggedIn && (currentPage === 'home' || currentPage === 'login')
      ? 'catalog'
      : currentPage;

    switch (pageToRender) {
      case 'home':           return <Home {...navProps} />;
      case 'catalog':        return <SchemesCatalog {...navProps} />;
      case 'scheme-details': return <SchemeDetails {...navProps} scheme={selectedScheme} />;
      case 'ai-matcher':     return <AIMatcher {...navProps} />;
      case 'eligibility':    return <EligibilityResults {...navProps} scheme={selectedScheme} />;
      case 'calculator':     return <FinancialCalculator {...navProps} scheme={selectedScheme} />;
      case 'documents':      return <RequiredDocuments {...navProps} scheme={selectedScheme} />;
      case 'partners':       return <PartnerLocator {...navProps} />;
      case 'guidance':       return <ApplicationGuidance {...navProps} scheme={selectedScheme} />;
      case 'dashboard':      return <Dashboard {...navProps} />;
      case 'conversations':  return <ConversationHistory {...navProps} />;
      case 'faq':            return <HelpFAQ {...navProps} />;
      case 'profile':        return <Profile {...navProps} />;
      default:               return isLoggedIn ? <SchemesCatalog {...navProps} /> : <Home {...navProps} />;
    }
  };

  return (
    <ThemeProvider>
      <ProfileProvider>
        <LanguageProvider>
          <div className="min-h-full flex flex-col theme-page" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Topmost Navbar */}
            <Navbar
              {...navProps}
              currentPage={isLoggedIn && (currentPage === 'home' || currentPage === 'login') ? 'catalog' : currentPage}
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              onAIOpen={handleAIOpen}
              onCallOpen={handleCallOpen}
            />

            <main className="flex-1">
              {renderPage()}
            </main>

            <Footer navigate={navigate} />

            {/* Global floating buttons */}
            <FloatingButtons
              onAIOpen={handleAIOpen}
              onCallOpen={handleCallOpen}
            />

            {/* AI Assistant modal */}
            {aiOpen && (
              <AIAssistant
                onClose={() => setAiOpen(false)}
                navigate={navigate}
                currentPage={currentPage}
                selectedScheme={currentPage === 'scheme-details' || currentPage === 'eligibility' || currentPage === 'calculator' || currentPage === 'documents' || currentPage === 'guidance' ? selectedScheme : undefined}
              />
            )}

            {/* Voice Call modal */}
            {callOpen && (
              <VoiceCall
                onClose={() => setCallOpen(false)}
                onContinueInChat={() => { setCallOpen(false); setAiOpen(true); }}
              />
            )}
          </div>
        </LanguageProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
