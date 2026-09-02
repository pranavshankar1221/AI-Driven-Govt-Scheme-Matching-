import { useState, useEffect, useRef } from 'react';
import type { NavProps } from '../types';
import { schemes } from '../data/schemes';
import { useLanguage } from '../context/LanguageContext';

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1920&q=80',
    title: 'Rural Artisans & Micro Enterprises',
    badge: '🧵 Artisan & Handloom Grants',
  },
  {
    url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1920&q=80',
    title: 'Agricultural Subsidies & Farmer Welfare',
    badge: '🌾 Farmer Financial Assistance',
  },
  {
    url: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?auto=format&fit=crop&w=1920&q=80',
    title: 'Women Entrepreneurship & Self-Help Groups',
    badge: '👩‍💼 Women Enterprise Credit',
  },
  {
    url: 'https://images.unsplash.com/photo-1596727147705-61a532a659bd?auto=format&fit=crop&w=1920&q=80',
    title: 'Small Business & Street Vendor Loans',
    badge: '🏪 Micro & Small Business Credit',
  },
];

export default function Home({ navigate }: NavProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const { t, getLocalizedSchemes, getLocalizedFAQs } = useLanguage();

  const locSchemes = getLocalizedSchemes(schemes);
  const locFaqs = getLocalizedFAQs();

  // Auto-rotate Hero background image slider every 5 seconds unless hovered
  useEffect(() => {
    if (isHeroHovered) return;
    const timer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroHovered]);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate('catalog');
    else navigate('ai-matcher');
  };

  const currentSlide = HERO_SLIDES[heroSlideIdx];

  const stats = [
    { value: '500+', label: t('stat1Label') },
    { value: '18 Lakh+', label: t('stat2Label') },
    { value: '94%', label: t('stat3Label') },
    { value: '15 Languages', label: t('stat4Label') },
  ];

  const steps = [
    { n: '01', title: t('step1Title'), desc: t('step1Desc'), icon: '👤' },
    { n: '02', title: t('step2Title'), desc: t('step2Desc'), icon: '🎯' },
    { n: '03', title: t('step3Title'), desc: t('step3Desc'), icon: '✓' },
    { n: '04', title: t('step4Title'), desc: t('step4Desc'), icon: '🏦' },
  ];

  const schemeCategories = [
    { label: t('catMsme'), count: 184, icon: '🏭' },
    { label: t('catHousing'), count: 67, icon: '🏠' },
    { label: t('catAgri'), count: 112, icon: '🌾' },
    { label: t('catSkills'), count: 95, icon: '🛠️' },
    { label: t('catWomen'), count: 78, icon: '👩‍💼' },
    { label: t('catSocial'), count: 143, icon: '🤝' },
  ];

  const features = [
    { icon: '🎯', title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: '✓', title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: '📄', title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: '📊', title: t('feat4Title'), desc: t('feat4Desc') },
    { icon: '📍', title: t('feat5Title'), desc: t('feat5Desc') },
    { icon: '🌐', title: t('feat6Title'), desc: t('feat6Desc') },
  ];

  return (
    <div className="overflow-x-hidden theme-page transition-colors duration-150">

      {/* ── HERO BANNER WITH VIBRANT, VISIBLE CITIZEN IMAGE SLIDER ── */}
      <section 
        className="relative text-white border-b border-[#001f3f] py-16 sm:py-24 overflow-hidden bg-slate-900"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
      >
        {/* Full-Color Background Image Slider with Smooth Crossfade */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.url}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              heroSlideIdx === idx ? 'opacity-85 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url('${slide.url}')`,
            }}
          />
        ))}

        {/* Translucent Dark Gradient Overlay for Maximum Text Readability while keeping imagery clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/75 to-slate-950/80" />
        <div className="absolute inset-0 bg-[#001f3f]/40" />

        {/* Left / Right Slide Navigation Arrows */}
        <button
          onClick={() => setHeroSlideIdx(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          onClick={() => setHeroSlideIdx(prev => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          aria-label="Next slide"
        >
          ›
        </button>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center animate-fade-in z-10">

          {/* Official Portal Badge + Current Slide Tag */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 bg-[#002b54]/80 backdrop-blur-md border border-sky-400/30 text-sky-200 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('heroBadge')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              <span>{currentSlide.badge}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4 drop-shadow-md" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('heroTitle')}
          </h1>

          <p className="text-slate-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8 font-medium drop-shadow">
            {t('heroSubtitle')}
          </p>

          {/* Search Box with Glass Panel */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch bg-white/95 dark:bg-[#08162b]/95 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-white/30 dark:border-white/20 transition-all focus-within:ring-2 focus-within:ring-sky-400">
              <div className="flex items-center flex-1 px-4 py-3.5">
                <svg className="w-5 h-5 text-slate-500 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-500 outline-none font-medium"
                />
              </div>
              <button
                onClick={handleSearch}
                className="gov-btn-primary px-7 py-3.5 text-xs sm:text-sm whitespace-nowrap rounded-none sm:rounded-r-lg font-bold shadow-md"
              >
                {t('searchSchemes')}
              </button>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              onClick={() => navigate('ai-matcher')}
              className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold rounded-md text-xs sm:text-sm transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2 border border-sky-400/30"
            >
              <span>✦</span>
              <span>{t('matchUsingAi')}</span>
            </button>
            <button
              onClick={() => navigate('catalog')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-md text-xs sm:text-sm transition-all border border-white/30 hover:-translate-y-0.5 backdrop-blur-md shadow-md"
            >
              {t('browseAllSchemes')}
            </button>
          </div>

          {/* Background Image Slide Indicators & Thumbnail Titles */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.url}
                onClick={() => setHeroSlideIdx(idx)}
                className={`transition-all ${
                  heroSlideIdx === idx
                    ? 'w-8 h-2 bg-sky-400 rounded-full shadow-md'
                    : 'w-2.5 h-2 bg-white/40 hover:bg-white/80 rounded-full'
                }`}
                title={slide.title}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="theme-card-subtle border-b theme-border py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x theme-border">
            {stats.map(({ value, label }) => (
              <div key={label} className="px-2 py-2">
                <p className="text-xl sm:text-2xl font-extrabold text-[#004b87] dark:text-sky-400 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
                <p className="text-[11px] theme-text-muted mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR GOVERNMENT SCHEMES (Clean Responsive Grid) ── */}
      <section className="py-12 border-b theme-border bg-slate-50/50 dark:bg-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-[10px] text-[#004b87] dark:text-sky-400 uppercase tracking-wider font-bold mb-0.5">{t('featuredBadge')}</p>
              <h2 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('featuredSchemes')}
              </h2>
            </div>
            <button
              onClick={() => navigate('catalog')}
              className="text-xs text-[#004b87] dark:text-sky-300 font-semibold hover:underline flex items-center gap-1"
            >
              <span>{t('viewFullDirectory')}</span>
              <span>→</span>
            </button>
          </div>

          {/* 6 Schemes Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {locSchemes.slice(0, 6).map((scheme) => (
              <div
                key={scheme.id}
                className="theme-card theme-card-hover rounded-xl p-5 border theme-border shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-[#004b87] dark:text-sky-300 border border-blue-500/20">
                      {scheme.type}
                    </span>
                    {scheme.badge && (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded uppercase">
                        {scheme.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="theme-text-main font-bold text-base mb-1 leading-snug line-clamp-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {scheme.name}
                  </h3>
                  <p className="text-[11px] theme-text-muted mb-3 font-medium">{scheme.organization}</p>

                  <div className="theme-card-subtle rounded-lg p-2.5 mb-3 border theme-border text-xs">
                    <span className="text-[10px] theme-text-muted uppercase font-bold block mb-0.5">{t('financialAssistance')}</span>
                    <span className="text-amber-800 dark:text-amber-300 font-bold">{scheme.financialAssistance}</span>
                  </div>

                  <p className="text-xs theme-text-muted line-clamp-2 leading-relaxed mb-4">
                    {scheme.description}
                  </p>
                </div>

                <div className="flex gap-2 pt-3 border-t theme-border text-xs">
                  <button
                    onClick={() => navigate('scheme-details', scheme.id)}
                    className="flex-1 gov-btn-primary py-2 text-center font-bold"
                  >
                    {t('viewScheme')}
                  </button>
                  <button
                    onClick={() => navigate('eligibility', scheme.id)}
                    className="flex-1 gov-btn-secondary py-2 text-center"
                  >
                    {t('checkEligibility')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-STEP CITIZEN ROADMAP ── */}
      <section className="py-14 border-b theme-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-[10px] text-[#004b87] dark:text-sky-400 uppercase tracking-wider font-bold mb-1">{t('citizenWorkflow')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('howItWorks')}
            </h2>
            <p className="theme-text-muted text-xs sm:text-sm mt-1">{t('workflowSubtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(({ n, title, desc, icon }) => (
              <div key={n} className="theme-card rounded-lg p-5 border theme-border shadow-sm flex flex-col justify-between hover:border-[#004b87] transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b theme-border pb-2.5">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-mono font-bold text-[#004b87] dark:text-sky-400">{n}</span>
                  </div>
                  <h3 className="theme-text-main font-bold text-sm mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</h3>
                  <p className="theme-text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTOR DIRECTORY ── */}
      <section className="py-12 border-b theme-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <p className="text-[10px] text-[#004b87] dark:text-sky-400 uppercase tracking-wider font-bold mb-1">{t('browseBySector')}</p>
            <h2 className="text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('schemeClassifications')}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {schemeCategories.map(({ label, count, icon }) => (
              <button
                key={label}
                onClick={() => navigate('catalog')}
                className="theme-card rounded-lg p-4 text-center border theme-border hover:border-[#004b87] transition-all shadow-sm flex flex-col items-center justify-between hover:-translate-y-1"
              >
                <span className="text-2xl mb-1.5">{icon}</span>
                <p className="theme-text-main text-xs font-semibold mb-2">{label}</p>
                <p className="text-[10px] theme-text-muted font-medium bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{count} {t('schemesCountLabel')}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM CAPABILITIES ── */}
      <section className="py-12 border-b theme-border bg-slate-50/50 dark:bg-black/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <p className="text-[10px] text-[#004b87] dark:text-sky-400 uppercase tracking-wider font-bold mb-1">{t('portalFeatures')}</p>
            <h2 className="text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('citizenServicesTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="theme-card rounded-lg p-5 border theme-border shadow-sm flex items-start gap-3.5 hover:border-[#004b87] transition-colors">
                <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <h3 className="theme-text-main font-bold text-xs sm:text-sm mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</h3>
                  <p className="theme-text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITIZEN FAQS ── */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <p className="text-[10px] text-[#004b87] dark:text-sky-400 uppercase tracking-wider font-bold mb-1">{t('faqsSubtitle')}</p>
            <h2 className="text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('faqsTitle')}
            </h2>
          </div>

          <div className="space-y-2.5">
            {locFaqs.slice(0, 5).map((faq, i) => (
              <div key={i} className="theme-card rounded-lg border theme-border overflow-hidden shadow-xs">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-base text-slate-400 ml-2 font-mono">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 text-xs theme-text-muted leading-relaxed border-t theme-border bg-slate-50/50 dark:bg-black/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
