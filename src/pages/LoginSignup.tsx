import { useState } from 'react';
import type { NavProps } from '../types';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';

interface Props extends NavProps {
  onLogin: () => void;
}

export default function LoginSignup({ navigate, onLogin }: Props) {
  const { profile, updateProfile, addDocument } = useProfile();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState(profile.name || 'Ravi Kumar');
  const [state, setState] = useState(profile.state || 'Tamil Nadu');
  const [city, setCity] = useState(profile.city || 'Coimbatore');
  const [category, setCategory] = useState(profile.category || 'OBC');
  const [occupation, setOccupation] = useState(profile.occupation || 'Tailor / Garments');
  const [income, setIncome] = useState(String(profile.annualIncome || '240000'));
  const [uploadedDocName] = useState('');

  const sendOtp = () => setOtpSent(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Save to unified reusable profile context
    updateProfile({
      name,
      state,
      city,
      district: city,
      category,
      occupation,
      businessType: occupation,
      annualIncome: income,
    });

    if (uploadedDocName) {
      addDocument({
        type: 'Aadhaar Card',
        name: uploadedDocName,
      });
    }

    onLogin();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-slate-900">
      {/* Background citizen imagery with deep translucent glass gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      {/* Multi-stop Glass Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-950" />
      <div className="absolute inset-0 bg-[#001f3f]/50" />

      {/* High-Contrast Frosted Glass Card */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl bg-slate-900/95 dark:bg-[#07172b]/95 backdrop-blur-2xl rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-700/80 dark:border-sky-500/30 animate-fade-in text-white">
        
        {/* Back Link & Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <button
            onClick={() => navigate('home')}
            className="text-xs text-sky-400 hover:text-sky-300 hover:underline font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>{t('back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#004b87] text-white flex items-center justify-center font-bold text-sm shadow-md border border-sky-400/30">
              S
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Sahaya
            </span>
          </div>
        </div>

        {/* Crisp Header Title (High Contrast White Text) */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {mode === 'login' ? 'Citizen Sign In' : 'Beneficiary Registration'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-md mx-auto font-medium">
            {mode === 'login' 
              ? 'Access your saved profile, matched schemes, and eligibility recommendations' 
              : 'Register once to unlock tailored government welfare scheme assistance'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                mode === m
                  ? 'border-sky-400 text-sky-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'login' ? 'Sign In via OTP' : 'New Registration'}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {mode === 'signup' && (
            <div>
              <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('name')}*</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-4 py-3 text-white outline-none shadow-sm text-xs sm:text-sm font-medium"
                required
              />
            </div>
          )}

          <div>
            <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">Mobile Number (Aadhaar-Linked)*</label>
            <div className="flex gap-2">
              <span className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono flex items-center font-bold text-xs sm:text-sm">
                +91
              </span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="flex-1 bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-4 py-3 text-white font-mono outline-none text-xs sm:text-sm font-medium"
                required
              />
              {!otpSent && (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="px-4 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white whitespace-nowrap font-bold text-xs sm:text-sm rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  Send OTP
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="space-y-2 animate-fade-in bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
              <label className="text-emerald-300 font-bold uppercase block text-[11px] tracking-wider">Enter 6-Digit OTP</label>
              <input
                defaultValue="123456"
                className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-4 py-3 text-emerald-300 text-lg font-mono tracking-widest outline-none text-center font-bold"
              />
              <p className="text-xs text-emerald-400 font-medium">OTP sent to +91 {phone} (Demo OTP: 123456)</p>
            </div>
          )}

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('state')}*</label>
                <input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('city')}*</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('beneficiaryCategory')}</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm outline-none font-medium"
                >
                  {['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'Women'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('occupation')}</label>
                <input
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm outline-none font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-300 font-bold uppercase block mb-1 text-[11px] tracking-wider">{t('annualIncome')} (₹)</label>
                <input
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm outline-none font-medium"
                />
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#004b87] hover:bg-[#003366] text-white text-sm sm:text-base font-bold rounded-xl shadow-lg transition-all border border-sky-400/30 cursor-pointer"
            >
              {mode === 'login' ? 'Verify OTP & Enter Portal →' : 'Create Profile & Access Schemes →'}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center pt-4 mt-4 border-t border-slate-800 text-xs text-slate-400">
          <p>
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setOtpSent(false); }}
              className="text-sky-400 hover:text-sky-300 hover:underline font-bold ml-1 cursor-pointer"
            >
              {mode === 'login' ? 'Register here' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
