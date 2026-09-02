import { useState } from 'react';
import type { NavProps } from '../types';
import { partners } from '../data/schemes';

export default function PartnerLocator({ navigate }: NavProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  const types = ['All', 'Public Sector Bank', 'Government Office', 'Government Agency', 'NBFC / MFI'];
  const filtered = partners.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'All' || p.type === selectedType;
    return matchSearch && matchType;
  });

  const selectedPartner = partners.find(p => p.id === selected);

  const Star = ({ filled }: { filled: boolean }) => (
    <svg className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
          <span>/</span>
          <span className="text-white">Partner Locator</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Find Authorized Partners</h1>
        <p className="text-slate-400">Locate banks, government offices, and agencies near you where you can apply for schemes.</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or area — e.g. Anna Nagar, T. Nagar…" className="w-full bg-[#0f1f3d] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500/50 transition-colors" />
        </div>
        <button className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Use My Location
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {types.map(t => (
          <button key={t} onClick={() => setSelectedType(t)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedType === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Map placeholder */}
        <div className="lg:col-span-3 bg-[#0f1f3d] border border-white/8 rounded-2xl overflow-hidden relative" style={{ minHeight: '400px' }}>
          {/* Mock map */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f3d] to-[#132040]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Map pins */}
          {filtered.map((p, i) => {
            const positions = [{ top: '35%', left: '45%' }, { top: '55%', left: '60%' }, { top: '45%', left: '30%' }, { top: '65%', left: '50%' }];
            const pos = positions[i] || { top: '50%', left: '50%' };
            return (
              <button key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }} className="group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform group-hover:scale-110 ${selected === p.id ? 'bg-blue-600 scale-110' : 'bg-blue-700'}`}>
                  {i + 1}
                </div>
                {selected === p.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#132040] border border-white/15 rounded-xl p-3 w-52 text-left shadow-2xl">
                    <p className="text-white text-xs font-semibold">{p.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{p.distance}</p>
                  </div>
                )}
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 glass rounded-xl px-3 py-2">
            <p className="text-white text-xs font-medium">Chennai, Tamil Nadu</p>
            <p className="text-slate-400 text-xs">{filtered.length} partners nearby</p>
          </div>
        </div>

        {/* Partner cards */}
        <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[600px]">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
              className={`bg-[#0f1f3d] border rounded-2xl p-4 cursor-pointer transition-all ${selected === p.id ? 'border-blue-500/50 bg-blue-600/5' : 'border-white/8 hover:border-white/20'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full truncate">{p.type}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-snug">{p.name}</h3>
                </div>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-lg flex-shrink-0">{p.distance}</span>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex gap-2 text-xs text-slate-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  <span>{p.address}</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{p.hours}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} filled={s <= Math.round(p.rating)} />)}
                <span className="text-xs text-slate-400 ml-1">{p.rating} ({p.reviewCount})</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {p.schemes.slice(0, 3).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{s}</span>
                ))}
              </div>

              <div className="flex gap-2">
                <a href={`tel:${p.phone}`} className="flex-1 text-xs border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-1.5 rounded-lg transition-colors text-center">
                  📞 Call
                </a>
                <button className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg transition-colors font-medium">
                  Get Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
