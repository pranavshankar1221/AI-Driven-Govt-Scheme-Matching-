import type { NavProps } from '../types';
import { schemes } from '../data/schemes';

export default function Dashboard({ navigate }: NavProps) {
  const savedSchemes = schemes.slice(0, 3);
  const recentConversations = [
    { title: 'Tailoring business loan enquiry', date: '2 hours ago', preview: 'Found 3 matching schemes — PMEGP, MUDRA, Stand-Up India' },
    { title: 'MUDRA eligibility check', date: 'Yesterday', preview: 'Eligible. 2 documents missing.' },
    { title: 'EMI calculation for ₹3L loan', date: '3 days ago', preview: 'EMI: ₹7,052/month with 25% PMEGP subsidy' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Dashboard</h1>
          <p className="text-slate-400">Welcome back, Ravi Kumar</p>
        </div>
        <button onClick={() => navigate('ai-matcher')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Find New Scheme
        </button>
      </div>

      {/* User profile card */}
      <div className="bg-gradient-to-r from-blue-700/30 to-[#0f1f3d] border border-blue-500/20 rounded-3xl p-6 mb-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>RK</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Ravi Kumar</h2>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span>📍 Coimbatore, Tamil Nadu</span>
            <span>👤 OBC · Age 28</span>
            <span>🏢 Urban</span>
            <span>💼 Tailoring Business</span>
          </div>
        </div>
        <button className="text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-colors">Edit Profile</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Schemes Matched', value: '4', icon: '🎯', color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20' },
          { label: 'Saved Schemes', value: '3', icon: '📌', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Eligibility Score', value: '87%', icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'AI Conversations', value: '7', icon: '💬', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        ].map(({ label, value, icon, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
            <p className="text-2xl mb-2">{icon}</p>
            <p className={`text-2xl font-bold ${color} mb-0.5`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended schemes */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Recommended for You</h2>
          <div className="space-y-3">
            {[
              { ...schemes[0], match: 94, reason: 'Best fit for your tailoring business in urban Coimbatore' },
              { ...schemes[1], match: 88, reason: 'Quick loan without collateral — ideal for working capital' },
              { ...schemes[2], match: 72, reason: 'High loan limit if SC/ST or woman entrepreneur' },
            ].map((scheme, i) => (
              <div key={scheme.id} className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 flex gap-4 hover:border-blue-500/30 transition-colors">
                <div className="text-center flex-shrink-0">
                  <span className={`text-xl font-bold ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-blue-400' : 'text-amber-400'}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{scheme.match}%</span>
                  <p className="text-xs text-slate-600">match</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-0.5 truncate">{scheme.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{scheme.reason}</p>
                  <div className="flex gap-2">
                    <button onClick={() => navigate('scheme-details', scheme.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View →</button>
                    <button onClick={() => navigate('eligibility', scheme.id)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Check Eligibility</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Recent conversations */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <h3 className="text-white font-semibold text-sm">Recent Conversations</h3>
              <button onClick={() => navigate('conversations')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all</button>
            </div>
            <div className="divide-y divide-white/5">
              {recentConversations.map((conv, i) => (
                <button key={i} onClick={() => navigate('conversations')} className="w-full px-5 py-3.5 text-left hover:bg-white/3 transition-colors">
                  <p className="text-white text-xs font-medium mb-0.5 truncate">{conv.title}</p>
                  <p className="text-slate-500 text-xs truncate">{conv.preview}</p>
                  <p className="text-slate-600 text-xs mt-1">{conv.date}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Application status */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Application Progress</h3>
            <div className="space-y-3">
              {[
                { label: 'PMEGP Application', status: 'Document Collection', pct: 25, color: 'bg-amber-500' },
                { label: 'MUDRA Enquiry', status: 'Eligibility Checked', pct: 40, color: 'bg-blue-600' },
              ].map(({ label, status, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-slate-500">{status}</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('guidance')} className="w-full mt-4 text-xs border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-2 rounded-xl transition-colors">View Application Guidance →</button>
          </div>

          {/* Saved schemes */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Saved Schemes</h3>
              <button onClick={() => navigate('catalog')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Browse more</button>
            </div>
            <div className="space-y-2">
              {savedSchemes.map(s => (
                <button key={s.id} onClick={() => navigate('scheme-details', s.id)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <span className="text-amber-400">📌</span>
                  <p className="text-slate-300 text-xs truncate">{s.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
