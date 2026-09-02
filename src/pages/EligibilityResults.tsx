import type { NavProps, Scheme } from '../types';

interface Props extends NavProps {
  scheme: Scheme;
}

const eligibleCriteria = [
  { label: 'Age Requirement', detail: 'Age 28 years — meets minimum of 18 years' },
  { label: 'Indian Citizenship', detail: 'Verified citizen of India' },
  { label: 'Business Category', detail: 'Tailoring qualifies as micro manufacturing enterprise' },
  { label: 'New / Existing Enterprise', detail: 'New enterprise — eligible for PMEGP first-time applicant' },
  { label: 'Location', detail: 'Coimbatore, Tamil Nadu — urban area, 15% subsidy tier' },
];

const missingInfo = [
  { label: 'Educational Certificate', detail: 'Required for projects above ₹10 Lakh — provide Class 8 or above certificate', action: 'Upload Document' },
  { label: 'Bank Account Statement', detail: '6 months statement needed — not yet submitted', action: 'Provide Info' },
];

const ineligible: string[] = [];

export default function EligibilityResults({ navigate, scheme }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate('scheme-details', scheme.id)} className="hover:text-white transition-colors truncate max-w-xs">{scheme.name}</button>
        <span>/</span>
        <span className="text-slate-300">Eligibility</span>
      </div>

      {/* Overall status */}
      <div className="bg-gradient-to-r from-emerald-600/15 to-blue-600/15 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-400/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">Likely Eligible</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>You are likely eligible for {scheme.name}</h1>
          <p className="text-slate-400 mt-1 text-sm">2 items need attention before application. Review the checklist below.</p>
        </div>
        <div className="text-center">
          <span className="text-4xl font-bold text-emerald-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>87%</span>
          <p className="text-xs text-slate-500 mt-0.5">eligibility score</p>
        </div>
      </div>

      {/* Scheme info */}
      <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-0.5">Scheme</p>
          <p className="text-white font-semibold text-sm">{scheme.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Financial Assistance</p>
          <p className="text-amber-400 font-semibold text-sm">{scheme.financialAssistance}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: criteria */}
        <div className="lg:col-span-2 space-y-4">
          {/* Eligible */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-emerald-400/5">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              <h2 className="text-white font-semibold text-sm">Eligible Criteria ({eligibleCriteria.length})</h2>
            </div>
            <div className="p-4 space-y-3">
              {eligibleCriteria.map(({ label, detail }) => (
                <div key={label} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing info */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-amber-400/5">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <h2 className="text-white font-semibold text-sm">Missing Information ({missingInfo.length})</h2>
            </div>
            <div className="p-4 space-y-3">
              {missingInfo.map(({ label, detail, action }) => (
                <div key={label} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{detail}</p>
                    <button className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors">{action} →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-blue-600/5 border border-blue-500/15 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Simple Explanation
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              You meet the core eligibility for <strong className="text-white">{scheme.name}</strong> — your age, citizenship, business type, and location all qualify. You only need to provide your educational certificate and bank statement to complete the application. Once submitted, you can expect up to <strong className="text-amber-400">25% subsidy</strong> on your loan.
            </p>
          </div>
        </div>

        {/* Right: next steps */}
        <div className="space-y-4">
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Next Steps</h3>
            <ol className="space-y-4">
              {[
                { n: 1, label: 'Collect missing documents', action: () => navigate('documents', scheme.id), btn: 'View Checklist' },
                { n: 2, label: 'Calculate your financial assistance', action: () => navigate('calculator', scheme.id), btn: 'Open Calculator' },
                { n: 3, label: 'Find nearest authorized partner', action: () => navigate('partners'), btn: 'Find Partner' },
                { n: 4, label: 'Get application guidance', action: () => navigate('guidance', scheme.id), btn: 'Get Guidance' },
              ].map(({ n, label, action, btn }) => (
                <li key={n} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{n}</div>
                  <div className="flex-1">
                    <p className="text-slate-200 text-xs mb-1.5">{label}</p>
                    <button onClick={action} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/25 hover:border-blue-500/50 px-3 py-1 rounded-lg transition-colors">{btn}</button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Similar Schemes</h3>
            {[{ id: 'mudra', name: 'MUDRA Yojana', match: 88 }, { id: 'standup', name: 'Stand-Up India', match: 72 }].map(s => (
              <button key={s.id} onClick={() => navigate('eligibility', s.id)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left mb-1">
                <p className="text-slate-300 text-xs">{s.name}</p>
                <span className="text-xs font-semibold text-emerald-400">{s.match}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
