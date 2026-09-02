import { useState } from 'react';
import type { NavProps } from '../types';
import { useLanguage } from '../context/LanguageContext';

const conversations = [
  {
    id: '1',
    title: 'Tailoring business loan enquiry',
    date: 'Today, 2:30 PM',
    duration: '8 min',
    lang: 'Tamil + English',
    preview: 'Matched PMEGP (94%), MUDRA (88%), and Stand-Up India (72%) based on Coimbatore urban profile.',
    messages: 12,
    schemeCards: 3,
  },
  {
    id: '2',
    title: 'MUDRA Yojana eligibility verification',
    date: 'Yesterday, 4:15 PM',
    duration: '5 min',
    lang: 'English',
    preview: 'Verified eligibility criteria for Kishore loan. Required: PAN card and 6-month bank statement.',
    messages: 8,
    schemeCards: 1,
  },
  {
    id: '3',
    title: 'EMI & Subsidy calculation for PMEGP loan',
    date: '12 Aug, 11:00 AM',
    duration: '4 min',
    lang: 'English',
    preview: 'Calculated project outlay for ₹3 Lakh with 25% subsidy: Monthly EMI ₹7,052 over 36 months.',
    messages: 6,
    schemeCards: 0,
  },
  {
    id: '4',
    title: 'PMEGP mandatory documents checklist',
    date: '10 Aug, 9:30 AM',
    duration: '3 min',
    lang: 'Tamil',
    preview: 'Aadhaar, PAN, Income Certificate, and Project Report required for first-time applicant submission.',
    messages: 5,
    schemeCards: 0,
  },
  {
    id: '5',
    title: 'Nearest partner bank in Coimbatore',
    date: '08 Aug, 3:45 PM',
    duration: '6 min',
    lang: 'Tamil + English',
    preview: 'Identified Canara Bank (0.8 km), SBI Gandhipuram (1.2 km), and DIC Coimbatore (2.1 km).',
    messages: 9,
    schemeCards: 2,
  },
];

export default function ConversationHistory({ navigate, onBack }: NavProps) {
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.preview.toLowerCase().includes(search.toLowerCase()) ||
    c.lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={() => {
            if (onBack) onBack();
            else navigate('dashboard');
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
        <button onClick={() => navigate('dashboard')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('dashboard')}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('chatHistory')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b theme-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('chatHistory')}
          </h1>
          <p className="theme-text-muted text-xs sm:text-sm mt-0.5">{t('portalFooterTag')}</p>
        </div>
        <button
          onClick={() => navigate('ai-matcher')}
          className="gov-btn-primary px-4 py-2 text-xs self-start sm:self-auto font-bold"
        >
          <span>✦ {t('matchUsingAi')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('catalogSearchPlaceholder')}
          className="w-full theme-input rounded-lg px-4 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
        />
      </div>

      {/* Conversation List */}
      <div className="space-y-3">
        {filtered.map((conv) => (
          <div
            key={conv.id}
            onClick={() => navigate('ai-matcher')}
            className="theme-card theme-card-hover rounded-lg p-5 border theme-border cursor-pointer shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="theme-text-main font-bold text-xs sm:text-sm truncate">
                {conv.title}
              </h3>
              <span className="text-[10px] theme-text-muted font-mono flex-shrink-0">{conv.date}</span>
            </div>

            <p className="theme-text-muted text-xs leading-relaxed mb-3">{conv.preview}</p>

            <div className="flex items-center gap-3 text-[11px] theme-text-muted pt-2.5 border-t theme-border">
              <span>🗣️ {conv.lang}</span>
              <span>💬 {conv.messages} messages</span>
              <span>⏱️ {conv.duration}</span>
              <span className="text-[#004b87] dark:text-sky-300 font-semibold ml-auto">{t('viewDetails')} →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
