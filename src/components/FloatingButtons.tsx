interface Props {
  onAIOpen: () => void;
  onCallOpen: () => void;
}

export default function FloatingButtons({ onAIOpen, onCallOpen }: Props) {
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end gap-3">
      {/* Voice Call button */}
      <div className="group flex items-center gap-2">
        <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity bg-[#132040] text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap">
          Talk to Sahaya AI
        </span>
        <button
          onClick={onCallOpen}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl hover:shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
          aria-label="Talk to Sahaya AI"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
      </div>

      {/* AI Assistant button */}
      <div className="group flex items-center gap-2">
        <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity bg-[#132040] text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap">
          Sahaya AI Assistant
        </span>
        <button
          onClick={onAIOpen}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-2xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 relative"
          aria-label="Open Sahaya AI Assistant"
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-blue-600 opacity-40 animate-pulse-ring" />
          <svg className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
