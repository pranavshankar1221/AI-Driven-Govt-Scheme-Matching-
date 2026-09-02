import { useState, useMemo } from 'react';
import type { NavProps } from '../types';
import { schemes } from '../data/schemes';
import { useLanguage } from '../context/LanguageContext';

export default function SchemesCatalog({ navigate, onBack }: NavProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');
  const [organization, setOrganization] = useState('All');
  const { t, getLocalizedSchemes } = useLanguage();

  const localizedList = getLocalizedSchemes(schemes);

  // Extract unique filter options from actual existing scheme dataset
  const types = useMemo(() => {
    const list = Array.from(new Set(schemes.map(s => s.type)));
    return ['All', ...list];
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    schemes.forEach(s => s.categories.forEach(c => set.add(c)));
    return ['All', ...Array.from(set)];
  }, []);

  const organizations = useMemo(() => {
    const list = Array.from(new Set(schemes.map(s => s.organization.split('/')[0].trim())));
    return ['All', ...list];
  }, []);

  const filtered = useMemo(() => {
    return localizedList.filter(s => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.organization.toLowerCase().includes(q) ||
        s.financialAssistance.toLowerCase().includes(q) ||
        s.categories.some(c => c.toLowerCase().includes(q));

      const matchType = type === 'All' || s.type.toLowerCase().includes(type.toLowerCase());
      const matchCategory = category === 'All' || s.categories.includes(category);
      const matchOrg = organization === 'All' || s.organization.toLowerCase().includes(organization.toLowerCase());

      return matchSearch && matchType && matchCategory && matchOrg;
    });
  }, [localizedList, search, type, category, organization]);

  const hasActiveFilters = search.trim() !== '' || type !== 'All' || category !== 'All' || organization !== 'All';

  const clearAllFilters = () => {
    setSearch('');
    setType('All');
    setCategory('All');
    setOrganization('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Contextual Back Button */}
      <div className="mb-3">
        <button
          onClick={() => {
            if (onBack) onBack();
            else navigate('home');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold transition-colors"
        >
          <span>←</span>
          <span>{t('home')}</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 theme-text-muted text-xs sm:text-sm mb-4">
        <button onClick={() => navigate('home')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('home')}</button>
        <span>/</span>
        <span className="theme-text-main font-semibold">{t('schemes')}</span>
      </div>

      {/* Page Header */}
      <div className="mb-6 pb-4 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('catalogTitle')}
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm mt-0.5">
          {t('catalogSubtitle')}
        </p>
      </div>

      {/* Search & "Find My Scheme" AI Action Bar */}
      <div className="theme-card rounded-md p-4 sm:p-5 mb-6 border theme-border shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('catalogSearchPlaceholder')}
              className="w-full theme-input rounded pl-10 pr-4 py-2.5 theme-text-main text-xs sm:text-sm outline-none shadow-inner"
            />
          </div>

          {/* Search Button & "Find My Scheme" with AI */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {}}
              className="px-4 py-2.5 gov-btn-secondary text-xs font-semibold"
            >
              {t('search')}
            </button>
            <button
              onClick={() => navigate('ai-matcher', undefined, { fromPage: 'catalog', fromLabel: 'Schemes' })}
              className="px-4 py-2.5 gov-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <span>{t('findMySchemeAI')}</span>
            </button>
          </div>
        </div>

        {/* Search vs AI Matcher Guidance */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] theme-text-muted pt-2 border-t theme-border">
          <p>
            <strong className="theme-text-main">{t('directSearch')}</strong> {t('directSearchDesc')}
          </p>
          <p className="text-[#004b87] dark:text-sky-300 font-medium">
            {t('aiMatcherPromo')}
          </p>
        </div>
      </div>

      {/* Filter Options Section */}
      <div className="theme-card rounded-md p-4 mb-6 border theme-border shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b theme-border pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold theme-text-main uppercase tracking-wider">{t('filterSchemes')}</span>
            {hasActiveFilters && (
              <span className="text-[10px] font-semibold bg-[#004b87] text-white px-2 py-0.2 rounded-full">
                {t('filtersActive')}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
            >
              {t('clearAllFilters')}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {/* 1. Category / Target Group */}
          <div>
            <label className="text-[11px] theme-text-muted font-bold block mb-1 uppercase tracking-wider">{t('beneficiaryCategory')}</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full theme-input rounded px-3 py-2 text-xs theme-text-main outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? t('allCategories') : c}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Assistance Type */}
          <div>
            <label className="text-[11px] theme-text-muted font-bold block mb-1 uppercase tracking-wider">{t('assistanceType')}</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full theme-input rounded px-3 py-2 text-xs theme-text-main outline-none"
            >
              {types.map(tOption => (
                <option key={tOption} value={tOption}>
                  {tOption === 'All' ? t('allAssistanceTypes') : tOption}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Ministry / Department */}
          <div>
            <label className="text-[11px] theme-text-muted font-bold block mb-1 uppercase tracking-wider">{t('ministryAgency')}</label>
            <select
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              className="w-full theme-input rounded px-3 py-2 text-xs theme-text-main outline-none"
            >
              {organizations.map(org => (
                <option key={org} value={org}>
                  {org === 'All' ? t('allMinistries') : org}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex justify-between items-center mb-4 text-xs">
        <p className="theme-text-muted font-medium">
          {t('showingSchemesCount')} <strong className="theme-text-main text-sm">{filtered.length}</strong> {filtered.length === 1 ? t('welfareScheme') : t('welfareSchemes')}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[#004b87] dark:text-sky-300 hover:underline font-semibold text-xs"
          >
            {t('resetFilters')}
          </button>
        )}
      </div>

      {/* Schemes Results List */}
      {filtered.length === 0 ? (
        <div className="theme-card rounded-md p-10 text-center border theme-border space-y-3">
          <p className="theme-text-main text-base font-bold">{t('noSchemesFound')}</p>
          <p className="theme-text-muted text-xs max-w-md mx-auto">
            {t('noSchemesDesc')}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 gov-btn-secondary text-xs"
            >
              {t('clearAllFilters')}
            </button>
            <button
              onClick={() => navigate('ai-matcher', undefined, { fromPage: 'catalog', fromLabel: 'Schemes' })}
              className="px-4 py-2 gov-btn-primary text-xs font-bold"
            >
              {t('tryAiMatcher')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(scheme => (
            <div
              key={scheme.id}
              className="theme-card theme-card-hover rounded-lg p-5 flex flex-col justify-between border shadow-sm"
            >
              <div>
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-semibold">
                    {scheme.type}
                  </span>
                  {scheme.badge && (
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      {scheme.badge}
                    </span>
                  )}
                </div>

                {/* Scheme Title & Ministry */}
                <h2 className="theme-text-main font-bold text-base mb-1 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {scheme.name}
                </h2>
                <p className="text-[11px] theme-text-muted mb-3 font-medium">{scheme.organization}</p>

                {/* Purpose / Description */}
                <p className="theme-text-secondary text-xs line-clamp-2 mb-3.5 leading-relaxed">
                  {scheme.purpose}
                </p>

                {/* Financial Assistance Highlight */}
                <div className="theme-card-subtle rounded p-2.5 mb-3 border theme-border">
                  <p className="text-[10px] theme-text-muted uppercase font-bold mb-0.5">{t('financialAssistance')}</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-snug">{scheme.financialAssistance}</p>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] theme-text-muted mb-4 pt-1 border-t theme-border">
                  <div>
                    <span className="text-[10px] uppercase block font-semibold">{t('ageLimit')}</span>
                    <span className="theme-text-main font-medium">{scheme.minAge} – {scheme.maxAge} {t('years')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block font-semibold">{t('targetGroups')}</span>
                    <span className="theme-text-main font-medium truncate block">{scheme.categories.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t theme-border text-xs">
                <button
                  onClick={() => navigate('scheme-details', scheme.id, { fromPage: 'catalog', fromLabel: 'Schemes' })}
                  className="flex-1 py-2 gov-btn-primary text-center font-bold"
                >
                  {t('viewDetails')}
                </button>
                <button
                  onClick={() => navigate('eligibility', scheme.id, { fromPage: 'catalog', fromLabel: 'Schemes' })}
                  className="flex-1 py-2 gov-btn-secondary text-center"
                >
                  {t('eligibility')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
