import { useState } from 'react';
import type { NavProps, Scheme } from '../types';

interface Props extends NavProps {
  scheme: Scheme;
}

const steps = [
  { n: 1, title: 'Profile & Eligibility Check', desc: 'Confirm you meet all eligibility criteria for the scheme. Use Sahaya to check your eligibility score.', duration: '5–10 min', status: 'done' as const, tips: ['Keep your Aadhaar ready', 'Know your category (SC/ST/OBC/General)', 'Confirm your age and income'] },
  { n: 2, title: 'Document Collection', desc: 'Gather all required documents. Use the Sahaya document checklist to track what you have and what is missing.', duration: '2–5 days', status: 'active' as const, tips: ['Get income certificate from Tahsildar', 'Obtain caste certificate from concerned authority', 'Prepare a project report with cost breakdown'] },
  { n: 3, title: 'Register on Scheme Portal', desc: 'Create an account on the official government scheme portal (e.g., kviconline.gov.in for PMEGP).', duration: '15–20 min', status: 'pending' as const, tips: ['Use Aadhaar-linked mobile number for OTP', 'Keep PAN card handy for financial verification', 'Save login credentials securely'] },
  { n: 4, title: 'Fill Online Application', desc: 'Complete the detailed application form online with your personal, business, and financial information.', duration: '30–45 min', status: 'pending' as const, tips: ['Fill all fields in English', 'Double-check all amounts and dates', 'Attach digital copies of documents (PDF, <2MB each)'] },
  { n: 5, title: 'Submit to Nearest Bank / Agency', desc: 'Visit your nearest authorized channel partner (bank or DIC) with your application printout and original documents.', duration: '1 day', status: 'pending' as const, tips: ['Carry all original documents for verification', 'Request acknowledgement receipt', 'Keep a copy of all submitted forms'] },
  { n: 6, title: 'Interview & Assessment', desc: 'Bank or agency conducts a personal interview and evaluates your project viability and credit worthiness.', duration: '1–2 weeks', status: 'pending' as const, tips: ['Be prepared to explain your business plan', 'Know your project costs and revenue projections', 'EDP training attendance may be required (PMEGP)'] },
  { n: 7, title: 'EDP Training (if applicable)', desc: 'Complete the mandatory Entrepreneurship Development Programme (EDP) training organized by KVIC/KVIB/DIC.', duration: '7–10 days', status: 'pending' as const, tips: ['Attend all sessions — attendance is mandatory', 'Training is free of cost', 'Certificate is required before loan disbursement'] },
  { n: 8, title: 'Loan Sanction & Disbursement', desc: 'Bank issues the sanction letter and disburses the loan to your account. Subsidy is credited separately.', duration: '2–4 weeks', status: 'pending' as const, tips: ['Open a current account for business transactions', 'Subsidy is locked for 3 years — do not withdraw', 'EMI starts after moratorium period'] },
];

export default function ApplicationGuidance({ navigate, scheme }: Props) {
  const [activeStep, setActiveStep] = useState(2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate('scheme-details', scheme.id)} className="hover:text-white transition-colors truncate max-w-xs">{scheme.name}</button>
        <span>/</span>
        <span className="text-slate-300">Application Guidance</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Application Journey</h1>
        <p className="text-slate-400">Step-by-step guide to apply for <span className="text-white font-medium">{scheme.name}</span></p>
      </div>

      {/* Progress summary */}
      <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-2">Overall Progress</p>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>2 / 8</p>
          <p className="text-xs text-slate-500">steps complete</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />Done</span>
          <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />Active</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-600" />Pending</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Steps list */}
        <div className="lg:col-span-2 space-y-3">
          {steps.map((step, i) => (
            <div key={step.n} className={`bg-[#0f1f3d] border rounded-2xl overflow-hidden cursor-pointer transition-all ${activeStep === i ? 'border-blue-500/40' : 'border-white/8 hover:border-white/20'}`} onClick={() => setActiveStep(i)}>
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${step.status === 'done' ? 'bg-emerald-500 text-white' : step.status === 'active' ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0f1f3d]' : 'bg-white/8 text-slate-400'}`}>
                  {step.status === 'done' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                    <span className="text-xs text-slate-500 flex-shrink-0">{step.duration}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
                  {step.status === 'active' && (
                    <span className="inline-block mt-2 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full font-medium">Current Step</span>
                  )}
                </div>
              </div>

              {/* Tips (expanded) */}
              {activeStep === i && (
                <div className="border-t border-white/5 px-5 pb-5 pt-3 bg-blue-600/3">
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">Tips</p>
                  <ul className="space-y-1.5">
                    {step.tips.map((tip, ti) => (
                      <li key={ti} className="flex gap-2 text-sm text-slate-300">
                        <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Check Eligibility', action: () => navigate('eligibility', scheme.id), icon: '✓' },
                { label: 'View Documents Checklist', action: () => navigate('documents', scheme.id), icon: '📋' },
                { label: 'Calculate EMI', action: () => navigate('calculator', scheme.id), icon: '📊' },
                { label: 'Find Nearest Partner', action: () => navigate('partners'), icon: '📍' },
              ].map(({ label, action, icon }) => (
                <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors border border-white/8 hover:border-white/20">
                  <span className="text-lg">{icon}</span>
                  <span className="text-slate-300 text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Important dates */}
          <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Estimated Timeline</h3>
            <div className="space-y-3">
              {[
                { label: 'Documents ready', date: '3–5 days' },
                { label: 'Application filed', date: '1 week' },
                { label: 'Bank interview', date: '2–3 weeks' },
                { label: 'Training complete', date: '4–6 weeks' },
                { label: 'Loan disbursed', date: '8–12 weeks' },
              ].map(({ label, date }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">{label}</span>
                  <span className="text-white text-xs font-medium">{date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Helpline */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
            <p className="text-blue-300 font-semibold text-sm mb-1">Need help?</p>
            <p className="text-slate-400 text-xs mb-3">Our support team is available Mon–Sat, 9 AM – 6 PM</p>
            <p className="text-white font-bold text-lg mb-2">1800-XXX-XXXX</p>
            <p className="text-xs text-slate-500">Toll-free · Multilingual support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
