import { useState } from 'react';
import type { NavProps } from '../types';

interface Props extends NavProps {
  onLogin: () => void;
}

export default function LoginSignup({ navigate, onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [category, setCategory] = useState('General');

  const sendOtp = () => setOtpSent(true);

  const handleSubmit = () => {
    onLogin();
    navigate('dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b1629] to-[#0f1f3d] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse 80% 80% at 30% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
            </div>
            <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Right Scheme.<br />
            Right Guidance.<br />
            <span className="text-amber-400">Right Opportunity.</span>
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-xs">
            Join 18 lakh beneficiaries who have found their perfect government scheme through Sahaya.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: '🤖', label: 'AI-powered scheme matching' },
            { icon: '✅', label: 'Eligibility check in seconds' },
            { icon: '📊', label: 'Financial calculator with subsidy' },
            { icon: '🌐', label: '6 Indian languages supported' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-slate-300 text-sm">{label}</span>
            </div>
          ))}
          <div className="mt-6 flex gap-2">
            {['English', 'தமிழ்', 'हिंदी', 'తెలుగు'].map(l => (
              <span key={l} className="text-xs text-slate-500 px-2 py-1 border border-white/10 rounded-full">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0b1629]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><span className="text-white font-bold text-sm">S</span></div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Sign in to access your schemes and conversations' : 'Join free to discover government schemes'}
            </p>
          </div>

          {/* Tab */}
          <div className="flex bg-[#0f1f3d] border border-white/8 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setOtpSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ravi Kumar" className="w-full bg-[#0f1f3d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-300 font-medium block mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <div className="bg-[#0f1f3d] border border-white/10 rounded-xl px-3 py-3 text-slate-300 text-sm flex items-center gap-1.5">
                  🇮🇳 +91
                </div>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" type="tel" className="flex-1 bg-[#0f1f3d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors" />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 font-medium block mb-2">State</label>
                  <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#0f1f3d] border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-blue-500/50">
                    {['Tamil Nadu', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Uttar Pradesh', 'Rajasthan', 'Gujarat', 'West Bengal'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 font-medium block mb-2">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0f1f3d] border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-blue-500/50">
                    {['General', 'SC', 'ST', 'OBC', 'EWS', 'Minorities'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {!otpSent ? (
              <button onClick={sendOtp} disabled={!phone} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all">
                {mode === 'login' ? 'Send OTP' : 'Create Account & Send OTP'}
              </button>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300 font-medium">Enter OTP</label>
                    <button onClick={() => setOtpSent(false)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Change number</button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">OTP sent to +91 {phone}</p>
                  <div className="flex gap-2">
                    {[0,1,2,3,4,5].map(i => (
                      <input key={i} maxLength={1} className="flex-1 bg-[#0f1f3d] border border-white/10 rounded-xl h-12 text-center text-white text-lg font-bold outline-none focus:border-blue-500/50 transition-colors" />
                    ))}
                  </div>
                </div>
                <button onClick={handleSubmit} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                  {mode === 'login' ? 'Sign In to Sahaya' : 'Complete Registration'}
                </button>
              </>
            )}

            <p className="text-center text-xs text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setOtpSent(false); }} className="text-blue-400 hover:text-blue-300 transition-colors">
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>

            <p className="text-center text-xs text-slate-600">
              By continuing, you agree to Sahaya's Terms of Use and Privacy Policy.<br />
              This platform is free for all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
