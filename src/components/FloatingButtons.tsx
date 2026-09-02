import { useLanguage } from '../context/LanguageContext';

interface Props {
  onAIOpen: () => void;
  onCallOpen: () => void;
}

export default function FloatingButtons({ onAIOpen, onCallOpen }: Props) {
  const { t } = useLanguage();

  return (
    <aside className="fixed bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end gap-2.5 pointer-events-auto" aria-label="Quick AI and Voice Assistance">
      {/* Live Voice Call Button */}
      <div className="group flex items-center gap-2">
        <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
          Voice Call
        </span>
        <button
          onClick={onCallOpen}
          className="w-11 h-11 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white shadow-lg transition-all duration-150 flex items-center justify-center border border-white/20"
          aria-label="Start Live Voice Call"
          title="Start Live Voice Call"
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
  );
}
