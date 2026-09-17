import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AI_AGENT_PHONE_NUMBER } from '../config';

interface Props {
  onAIOpen: () => void;
  onCallOpen: () => void;
}

export default function FloatingButtons({ onAIOpen, onCallOpen }: Props) {
  const { t } = useLanguage();
  const [showUnconfiguredModal, setShowUnconfiguredModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  const hasPhoneNumber = Boolean(AI_AGENT_PHONE_NUMBER && AI_AGENT_PHONE_NUMBER.trim() !== '');

  const handlePhoneClick = () => {
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (!hasPhoneNumber) {
      setShowUnconfiguredModal(true);
      return;
    }

    if (isMobile) {
      // Trigger native phone dialer
      window.location.href = `tel:${AI_AGENT_PHONE_NUMBER.trim()}`;
    } else {
      // Show desktop call modal with phone number details
      setShowDesktopModal(true);
    }
  };

  return (
    <>
      <aside className="fixed bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end gap-2.5 pointer-events-auto" aria-label="Quick AI and Voice Assistance">
        {/* Live Voice Call Button */}
        <div className="group flex items-center gap-2">
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
            {hasPhoneNumber ? `Call ${AI_AGENT_PHONE_NUMBER}` : 'Phone Agent (Unconfigured)'}
          </span>
          <button
            onClick={handlePhoneClick}
            disabled={!hasPhoneNumber}
            className={`w-11 h-11 rounded-lg text-white shadow-lg transition-all duration-150 flex items-center justify-center border border-white/20 ${
              hasPhoneNumber
                ? 'bg-[#15803d] hover:bg-[#166534] cursor-pointer'
                : 'bg-slate-500/50 cursor-not-allowed opacity-60'
            }`}
            aria-label="Start Live Voice Call"
            title={hasPhoneNumber ? `Call ${AI_AGENT_PHONE_NUMBER}` : 'AI Phone Agent Not Configured'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>

        {/* AI Assistant Button */}
        <div className="group flex items-center gap-2">
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
            {t('askAi')}
          </span>
          <button
            onClick={onAIOpen}
            className="w-12 h-12 rounded-lg bg-[#004b87] hover:bg-[#003366] text-white shadow-lg transition-all duration-150 flex items-center justify-center border border-white/20"
            aria-label={t('askAi')}
            title={t('askAi')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Unconfigured Phone Number Modal */}
      {showUnconfiguredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md theme-modal border theme-border rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-bold theme-text-main">AI Phone Agent Not Configured</h3>
            </div>
            <p className="text-xs theme-text-subtle leading-relaxed">
              The phone agent number is currently not configured in your environment. To enable mobile dialer routing, set <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded font-mono text-[11px]">AI_AGENT_PHONE_NUMBER</code> in your <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded font-mono text-[11px]">backend/.env</code> file.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowUnconfiguredModal(false)}
                className="px-4 py-1.5 gov-btn-secondary text-xs rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Call Information Modal */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md theme-modal border theme-border rounded-lg p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-main">Call YojanaSetu AI Helpline</h3>
              <p className="text-xs theme-text-subtle mt-1">Speak with our multilingual AI assistant on your phone</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-emerald-400 font-mono text-lg font-bold tracking-wider">
              {AI_AGENT_PHONE_NUMBER}
            </div>
            <p className="text-[11px] theme-text-muted">
              Supports English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, and Hinglish.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDesktopModal(false);
                  onCallOpen();
                }}
                className="flex-1 py-2 gov-btn-primary text-xs"
              >
                Start In-Browser Voice Call
              </button>
              <button
                onClick={() => setShowDesktopModal(false)}
                className="px-4 py-2 gov-btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
