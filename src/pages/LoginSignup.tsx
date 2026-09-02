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
        className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      {/* Multi-stop Glass Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-slate-950/85" />
      <div className="absolute inset-0 bg-[#001f3f]/40" />

      {/* Spacious Frosted Glass Card for Sahaya */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl backdrop-blur-xl bg-white/95 dark:bg-[#0b1e36]/90 rounded-2xl p-6 sm:p-10 shadow-2xl border border-white/30 dark:border-white/15 animate-fade-in">
        
        {/* Back Link & Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b theme-border">
          <button
            onClick={() => navigate('home')}
            className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>{t('back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-white/20">
              S
            </div>
            <span className="theme-text-main font-bold text-lg tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Sahaya
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-[#004b87] dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('heroBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {mode === 'login' ? 'Citizen Sign In' : 'Beneficiary Welfare Registration'}
          </h1>
          <p className="theme-text-muted text-xs sm:text-sm mt-1.5 leading-relaxed max-w-md mx-auto">
            {mode === 'login' 
              ? 'Access your saved profile, matched schemes, and documents' 
              : 'Register once to unlock tailored welfare scheme assistance'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b theme-border mb-6 gap-2">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                mode === m
                  ? 'border-[#004b87] text-[#004b87] dark:text-sky-300 dark:border-sky-400 font-bold'
                  : 'border-transparent theme-text-muted hover:theme-text-main'
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
              <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('name')}*</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full theme-input rounded-lg px-4 py-3 theme-text-main outline-none shadow-sm text-xs sm:text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">Mobile Number (Aadhaar-Linked)*</label>
            <div className="flex gap-2">
              <span className="px-4 py-3 theme-card-subtle border theme-border rounded-lg theme-text-main font-mono flex items-center font-bold text-xs sm:text-sm">
                +91
              </span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="flex-1 theme-input rounded-lg px-4 py-3 theme-text-main font-mono outline-none text-xs sm:text-sm"
                required
              />
              {!otpSent && (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="px-4 py-3 gov-btn-primary whitespace-nowrap font-bold text-xs sm:text-sm shadow-md"
                >
                  Send OTP
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="space-y-2 animate-fade-in bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <label className="theme-text-main font-bold uppercase block text-xs">Enter 6-Digit OTP</label>
              <input
                defaultValue="123456"
                className="w-full theme-input rounded-lg px-4 py-3 theme-text-main text-lg font-mono tracking-widest outline-none text-center font-bold"
              />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">✓ OTP sent to +91 {phone} (Demo OTP: 123456)</p>
            </div>
          )}

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('state')}*</label>
                <input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full theme-input rounded-lg px-3.5 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
                  required
                />
              </div>
              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('city')}*</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full theme-input rounded-lg px-3.5 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
                  required
                />
              </div>
              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('beneficiaryCategory')}</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full theme-input rounded-lg px-3.5 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
                >
                  {['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'Women'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('occupation')}</label>
                <input
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  className="w-full theme-input rounded-lg px-3.5 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="theme-text-muted font-bold uppercase block mb-1 text-xs">{t('annualIncome')} (₹)</label>
                <input
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  className="w-full theme-input rounded-lg px-3.5 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 gov-btn-primary text-sm sm:text-base font-bold rounded-xl shadow-lg transition-all"
            >
              {mode === 'login' ? 'Verify OTP & Enter Portal →' : 'Create Profile & Access Schemes →'}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center pt-4 mt-4 border-t theme-border text-xs theme-text-muted">
          <p>
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setOtpSent(false); }}
              className="text-[#0284c7] dark:text-sky-400 hover:underline font-bold"
            >
              {mode === 'login' ? 'Register here' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
