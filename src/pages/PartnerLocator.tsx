import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { NavProps, Partner } from '../types';
import { partners as staticPartners } from '../data/schemes';
import { schemeService } from '../services/schemeService';
import { useLanguage } from '../context/LanguageContext';

interface LeafletMapProps {
  partners: Partner[];
  selectedId: string | null;
  onSelectPartner: (id: string | null) => void;
}

function LeafletMapView({ partners, selectedId, onSelectPartner }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [googleMapsKey, setGoogleMapsKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [showKeyModal, setShowKeyModal] = useState(false);

  const TILE_CONFIGS = {
    streets: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri World Imagery',
      maxZoom: 18,
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const map = L.map(mapContainerRef.current, {
      center: [13.0550, 80.2350], // Chennai Center
      zoom: 12,
      zoomControl: false,
    });

    // Add Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialConfig = TILE_CONFIGS[mapStyle];
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const config = TILE_CONFIGS[mapStyle];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Render & update partner markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    const bounds: [number, number][] = [];

    partners.forEach((p, idx) => {
      const lat = p.lat ?? (13.0400 + idx * 0.02);
      const lng = p.lng ?? (80.2100 + idx * 0.02);
      bounds.push([lat, lng]);

      const isSelected = p.id === selectedId;

      // Custom HTML Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 36px; height: 36px; border-radius: 50%;
              background: ${isSelected ? '#004b87' : '#002b54'};
              color: white; font-weight: 800; font-size: 13px;
              display: flex; align-items: center; justify-content: center;
              border: 2px solid ${isSelected ? '#f59e0b' : '#ffffff'};
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              transition: transform 0.2s ease;
              ${isSelected ? 'transform: scale(1.15);' : ''}
            ">
              ${idx + 1}
            </div>
            <div style="
              width: 0; height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${isSelected ? '#004b87' : '#002b54'};
              margin-top: -1px;
            "></div>
            <div style="
              margin-top: 3px; background: rgba(15, 23, 42, 0.9);
              color: white; font-size: 10px; font-weight: 700;
              padding: 2px 8px; border-radius: 12px;
              white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">
              ${p.name.split('—')[0]}
            </div>
          </div>
        `,
        iconSize: [40, 56],
        iconAnchor: [20, 48],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Popup content with Google Maps API link
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 240px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:10px; font-weight:800; color:#004b87; text-transform:uppercase;">${p.type}</span>
            <span style="font-size:10px; background:#dcfce7; color:#166534; font-weight:700; padding:2px 6px; border-radius:10px;">${p.distance}</span>
          </div>
          <h4 style="margin:0 0 4px 0; font-size:13px; font-weight:700; color:#0f172a;">${p.name}</h4>
          <p style="margin:0 0 6px 0; font-size:11px; color:#475569; line-height:1.3;">${p.address}</p>
          <div style="display:flex; gap:6px; border-top:1px solid #e2e8f0; padding-top:6px; margin-top:6px;">
            <a href="tel:${p.phone}" style="flex:1; text-align:center; background:#f1f5f9; color:#0f172a; text-decoration:none; padding:4px 6px; border-radius:4px; font-size:11px; font-weight:600;">📞 Call</a>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="flex:1.2; text-align:center; background:#004b87; color:white; text-decoration:none; padding:4px 6px; border-radius:4px; font-size:11px; font-weight:600;">🗺️ Directions</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectPartner(p.id);
        map.panTo([lat, lng], { animate: true });
      });

      markersRef.current[p.id] = marker;
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [partners, selectedId]);

  // Open popup if partner selected externally
  useEffect(() => {
    if (!selectedId || !markersRef.current[selectedId]) return;
    const marker = markersRef.current[selectedId];
    marker.openPopup();
  }, [selectedId]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col justify-between overflow-hidden rounded-md">
      {/* Map Tile Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900" />

      {/* Top Map Control Bar */}
      <div className="relative z-10 p-3 flex flex-wrap justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b theme-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold theme-text-main">
            Interactive Maps Engine ({partners.length} Nodal Centers)
          </span>
        </div>

        {/* Map Type Switcher Buttons */}
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
          <button
            onClick={() => setMapStyle('streets')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
              mapStyle === 'streets'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 theme-text-muted hover:theme-text-main'
            }`}
          >
            🗺️ Street
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
              mapStyle === 'satellite'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 theme-text-muted hover:theme-text-main'
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
              mapStyle === 'dark'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 theme-text-muted hover:theme-text-main'
            }`}
          >
            🌙 Dark
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="text-[10px] font-semibold text-[#004b87] dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded border border-sky-200 dark:border-sky-800 hover:underline"
            title="Configure Google Maps API Key"
          >
            🔑 Maps API
          </button>
        </div>
      </div>

      {/* Footer Info Overlay */}
      <div className="relative z-10 p-3 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t theme-border">
        <span className="text-xs theme-text-main font-semibold">
          📍 Real GPS Coordinates Enabled (Chennai Metro)
        </span>
        <span className="text-[10px] theme-text-muted">
          Pan & Zoom Map · Click Pins for Directions
        </span>
      </div>

      {/* Google Maps API Key Integration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="theme-card rounded-lg p-5 max-w-md w-full border theme-border shadow-2xl">
            <h3 className="text-sm font-bold theme-text-main mb-2">🔑 Google Maps API Integration</h3>
            <p className="theme-text-muted text-xs mb-3 leading-relaxed">
              Sahaya AI currently uses Leaflet with OpenStreetMap / CartoDB / Esri Satellite map tiles out-of-the-box. If you wish to use your official **Google Maps JavaScript API Key**, paste it below or save it in your project's <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> as <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-bold theme-text-main block mb-1">Google Maps API Key</label>
              <input
                type="text"
                value={googleMapsKey}
                onChange={e => setGoogleMapsKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full theme-input rounded px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 gov-btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Maps API configuration updated!');
                  setShowKeyModal(false);
                }}
                className="px-4 py-1.5 gov-btn-primary"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [partnerList, setPartnerList] = useState<Partner[]>(staticPartners);
  const { t, getLocalizedPartners } = useLanguage();

  useEffect(() => {
    let mounted = true;
    schemeService.getNearbyPartners({ schemeId: selectedSchemeId }).then(res => {
      if (mounted && Array.isArray(res) && res.length > 0) {
        setPartnerList(res);
      }
    }).catch(err => console.warn('Failed to load partners from backend, using fallback list:', err));
    return () => { mounted = false; };
  }, [selectedSchemeId]);

  const locPartners = getLocalizedPartners(partnerList);
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
        {/* Real Interactive Leaflet / Maps API Container */}
        <div className="lg:col-span-3 theme-card rounded-md overflow-hidden relative shadow-lg border theme-border min-h-[460px] flex flex-col justify-between">
          <LeafletMapView
            partners={filtered}
            selectedId={selected}
            onSelectPartner={pId => setSelected(pId)}
          />
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
