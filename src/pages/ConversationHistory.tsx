import type { NavProps } from '../types';

const conversations = [
  {
    id: '1', title: 'Tailoring business loan enquiry', date: '2024-01-15, 2:30 PM', duration: '8 min', lang: 'Tamil + English',
    preview: 'Found PMEGP, MUDRA, Stand-Up India matching 94%, 88%, 72%',
    messages: 12, schemeCards: 3,
  },
  {
    id: '2', title: 'MUDRA Yojana eligibility check', date: '2024-01-14, 4:15 PM', duration: '5 min', lang: 'English',
    preview: 'Eligible. Missing: PAN Card, Bank Statement.',
    messages: 8, schemeCards: 1,
  },
  {
    id: '3', title: 'EMI calculation for PMEGP loan', date: '2024-01-12, 11:00 AM', duration: '4 min', lang: 'English',
    preview: 'For ₹3L with 25% subsidy: EMI ₹7,052/month over 36 months.',
    messages: 6, schemeCards: 0,
  },
  {
    id: '4', title: 'Required documents enquiry', date: '2024-01-10, 9:30 AM', duration: '3 min', lang: 'Tamil',
    preview: 'Aadhaar, PAN, Income Certificate, Project Report required for PMEGP.',
    messages: 5, schemeCards: 0,
  },
  {
    id: '5', title: 'Nearest bank partner in Coimbatore', date: '2024-01-08, 3:45 PM', duration: '6 min', lang: 'Tamil + English',
    preview: 'Found Canara Bank (0.8 km), SBI T. Nagar (1.2 km), DIC Nandanam (2.1 km).',
    messages: 9, schemeCards: 2,
  },
  {
    id: '6', title: 'Stand-Up India eligibility check', date: '2024-01-05, 1:00 PM', duration: '7 min', lang: 'English',
    preview: 'Needs Review — SC/ST or women category required for Stand-Up India.',
    messages: 11, schemeCards: 2,
  },
  {
    id: '7', title: 'Government housing scheme options', date: '2024-01-03, 10:20 AM', duration: '5 min', lang: 'Hindi',
    preview: 'PMAY CLSS for EWS/LIG with up to 6.5% interest subsidy found.',
    messages: 7, schemeCards: 1,
  },
];

export default function ConversationHistory({ navigate }: NavProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <span className="text-white">Conversation History</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Conversation History</h1>
          <p className="text-slate-400 text-sm">All your past Sahaya AI sessions</p>
        </div>
        <button onClick={() => navigate('ai-matcher')} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors">New Chat</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Conversations', value: conversations.length },
          { label: 'Schemes Discovered', value: '12' },
          { label: 'Languages Used', value: '3' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Conversation list */}
      <div className="space-y-3">
        {conversations.map((conv) => (
          <div key={conv.id} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 hover:border-blue-500/30 transition-all cursor-pointer group">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors mb-1 truncate">{conv.title}</h3>
                <p className="text-slate-400 text-xs">{conv.preview}</p>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/25 hover:border-blue-500/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                Resume
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {conv.date}
              </span>
              <span>{conv.duration}</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {conv.messages} messages
              </span>
              {conv.schemeCards > 0 && (
                <span className="text-amber-400">{conv.schemeCards} scheme cards</span>
              )}
              <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{conv.lang}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
