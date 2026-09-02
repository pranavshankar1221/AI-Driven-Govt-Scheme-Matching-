import { useState } from 'react';
import type { Page } from './types';
import { schemes } from './data/schemes';

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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('pmegp');
  const [aiOpen, setAiOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = (page: Page, schemeId?: string) => {
    if (schemeId) setSelectedSchemeId(schemeId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId) ?? schemes[0];
  const navProps = { navigate, currentPage };

  const noNav: Page[] = ['login'];
  const noFooter: Page[] = ['login'];

  const renderPage = () => {
    switch (currentPage) {
      case 'home':         return <Home {...navProps} />;
      case 'catalog':      return <SchemesCatalog {...navProps} />;
      case 'scheme-details': return <SchemeDetails {...navProps} scheme={selectedScheme} />;
      case 'ai-matcher':   return <AIMatcher {...navProps} />;
      case 'eligibility':  return <EligibilityResults {...navProps} scheme={selectedScheme} />;
      case 'calculator':   return <FinancialCalculator {...navProps} scheme={selectedScheme} />;
      case 'documents':    return <RequiredDocuments {...navProps} scheme={selectedScheme} />;
      case 'partners':     return <PartnerLocator {...navProps} />;
      case 'guidance':     return <ApplicationGuidance {...navProps} scheme={selectedScheme} />;
      case 'dashboard':    return <Dashboard {...navProps} />;
      case 'conversations':return <ConversationHistory {...navProps} />;
      case 'faq':          return <HelpFAQ {...navProps} />;
      case 'login':        return <LoginSignup {...navProps} onLogin={() => setIsLoggedIn(true)} />;
      default:             return <Home {...navProps} />;
    }
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#0b1629', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {!noNav.includes(currentPage) && (
        <Navbar {...navProps} isLoggedIn={isLoggedIn} />
      )}

      <main className="flex-1">
        {renderPage()}
      </main>

      {!noFooter.includes(currentPage) && (
        <Footer navigate={navigate} />
      )}

      {/* Global floating buttons */}
      <FloatingButtons
        onAIOpen={() => setAiOpen(true)}
        onCallOpen={() => setCallOpen(true)}
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
  );
}
