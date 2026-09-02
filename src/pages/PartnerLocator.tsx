import { useState } from 'react';
import type { NavProps } from '../types';
import { partners } from '../data/schemes';
import { useLanguage } from '../context/LanguageContext';

export default function PartnerLocator({
  navigate,
  previousPage,
  previousLabel,
  onBack,
  selectedSchemeId,
}: NavProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const { t, getLocalizedPartners } = useLanguage();

  const locPartners = getLocalizedPartners(partners);
  const types = ['All', 'Public Sector Bank', 'Government Office', 'Government Agency', 'NBFC / MFI'];
  const filtered = locPartners.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'All' || p.type === selectedType;
    return matchSearch && matchType;
  });

  const selectedPartner = locPartners.find(p => p.id === selected);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (previousPage === 'scheme-details' && selectedSchemeId) {
      navigate('scheme-details', selectedSchemeId);
    } else if (previousPage === 'ai-matcher') {
      navigate('ai-matcher');
    } else {
      navigate('home');
    }
  };

  const backLabel =
    previousPage === 'scheme-details'
      ? t('backToSchemeDetails')
      : previousPage === 'ai-matcher'
      ? t('backToAiMatcherResults')
      : previousLabel
      ? previousLabel
      : t('back');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold transition-colors"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 theme-text-muted text-xs sm:text-sm mb-4 flex-wrap">
        <button onClick={() => navigate('home')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('home')}</button>
        <span>/</span>
        {previousPage === 'ai-matcher' ? (
          <>
            <button onClick={() => navigate('ai-matcher')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('aiMatcher')}</button>
            <span>/</span>
            {selectedSchemeId && (
              <>
                <button onClick={() => navigate('scheme-details', selectedSchemeId)} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors uppercase font-mono">{selectedSchemeId}</button>
                <span>/</span>
              </>
            )}
          </>
        ) : previousPage === 'scheme-details' && selectedSchemeId ? (
          <>
            <button onClick={() => navigate('catalog')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('schemes')}</button>
            <span>/</span>
            <button onClick={() => navigate('scheme-details', selectedSchemeId)} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors uppercase font-mono">{selectedSchemeId}</button>
            <span>/</span>
          </>
        ) : (
          <>
            <button onClick={() => navigate('catalog')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('schemes')}</button>
            <span>/</span>
          </>
        )}
        <span className="theme-text-main font-semibold">{t('channelPartners')}</span>
      </div>

      {/* Header */}
      <div className="mb-6 pb-3 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('channelPartners')}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
          {t('partnerSubtitle')}
        </p>
      </div>

      {/* Search Bar & Location Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchLocationPlaceholder')}
            className="w-full theme-input rounded pl-10 pr-4 py-2.5 theme-text-main text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {types.map(tOption => (
          <button
            key={tOption}
            onClick={() => setSelectedType(tOption)}
            className={`text-xs px-3 py-1 rounded transition-colors font-medium border ${
              selectedType === tOption
                ? 'bg-[#004b87] text-white border-[#004b87] font-semibold'
                : 'border-slate-200 dark:border-white/10 theme-text-muted hover:theme-text-main theme-card-subtle'
            }`}
          >
            {tOption === 'All' ? t('allPartners') : tOption}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Styled Map Container */}
        <div className="lg:col-span-3 theme-card rounded-md overflow-hidden relative shadow-xs border theme-border min-h-[380px]">
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900/50">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(#004b87 1px, transparent 1px), linear-gradient(90deg, #004b87 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            />
          </div>

          {/* Map Pins */}
          {filtered.map((p, i) => {
            const positions = [{ top: '35%', left: '42%' }, { top: '58%', left: '62%' }, { top: '42%', left: '28%' }, { top: '68%', left: '48%' }];
            const pos = positions[i] || { top: '50%', left: '50%' };
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(isSelected ? null : p.id)}
                style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
                className="group z-10 transition-transform"
                aria-label={`Partner pin: ${p.name}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md transition-all border ${
                  isSelected
                    ? 'bg-[#004b87] border-white scale-110'
                    : 'bg-[#002b54] border-white/60 hover:bg-[#004b87]'
                }`}>
                  {i + 1}
                </div>

                {isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 theme-card rounded p-2.5 w-52 text-left shadow-lg z-20 border theme-border">
                    <p className="theme-text-main text-xs font-bold truncate">{p.name}</p>
                    <p className="text-[#004b87] dark:text-sky-300 text-[10px] font-semibold">{p.distance} · {p.hours}</p>
                    <p className="theme-text-muted text-[10px] mt-0.5 line-clamp-1">{p.address}</p>
                  </div>
                )}
              </button>
            );
          })}

          {/* Location Badge */}
          <div className="absolute bottom-3 left-3 theme-card rounded px-3 py-1.5 shadow-sm border theme-border text-xs">
            <p className="theme-text-main font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{t('available')}</span>
            </p>
            <p className="theme-text-muted text-[10px]">{filtered.length} {t('supportedSchemes')}</p>
          </div>
        </div>

        {/* Partner Cards Feed */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelected(isSelected ? null : p.id)}
                className={`theme-card rounded-md p-4 transition-colors cursor-pointer border shadow-xs ${
                  isSelected ? 'border-[#004b87] dark:border-sky-400 ring-1 ring-[#004b87]' : 'theme-border hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <h2 className="theme-text-main font-bold text-xs sm:text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {p.name}
                    </h2>
                  </div>
                  <span className="text-[10px] theme-text-muted font-semibold bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                    {p.distance}
                  </span>
                </div>

                <p className="text-[11px] text-[#004b87] dark:text-sky-300 font-semibold mb-1">{p.type}</p>
                <p className="theme-text-muted text-[11px] mb-2 leading-relaxed">{p.address}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {p.schemes.map(s => (
                    <span key={s} className="text-[9px] theme-card-subtle theme-text-muted px-1.5 py-0.2 rounded border theme-border font-medium">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t theme-border text-xs">
                  <a
                    href={`tel:${p.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 py-1.5 gov-btn-secondary text-center"
                  >
                    📞 {t('contact')}
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(p.id); }}
                    className="flex-1 py-1.5 gov-btn-primary text-center"
                  >
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPartner && (
        <div className="mt-6 theme-card rounded-md p-5 border theme-border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-bold theme-text-main">{selectedPartner.name}</h3>
              <p className="text-xs text-[#004b87] dark:text-sky-300 font-semibold">{selectedPartner.type} · {selectedPartner.distance}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕ {t('close')}
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="theme-card-subtle rounded p-2.5 border theme-border">
              <span className="text-[10px] theme-text-muted uppercase font-bold block">Address</span>
              <p className="theme-text-main mt-0.5">{selectedPartner.address}</p>
            </div>
            <div className="theme-card-subtle rounded p-2.5 border theme-border">
              <span className="text-[10px] theme-text-muted uppercase font-bold block">{t('contact')}</span>
              <p className="theme-text-main mt-0.5">{selectedPartner.phone}</p>
              <p className="theme-text-muted text-[10px]">{selectedPartner.email}</p>
            </div>
            <div className="theme-card-subtle rounded p-2.5 border theme-border">
              <span className="text-[10px] theme-text-muted uppercase font-bold block">{t('operatingHours')}</span>
              <p className="theme-text-main mt-0.5">{selectedPartner.hours}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
