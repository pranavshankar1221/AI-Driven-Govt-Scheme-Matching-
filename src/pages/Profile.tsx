import { useState } from 'react';
import type { NavProps } from '../types';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';
import type { ProfileDocumentStatus, ProfileDocument } from '../types/ai';

const INDIAN_STATES = [
  'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana',
  'Kerala', 'Uttar Pradesh', 'Rajasthan', 'Gujarat', 'West Bengal',
  'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Odisha', 'Delhi'
];

const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'Women', 'Ex-Servicemen'];
const GENDERS = ['Male', 'Female', 'Other'];
const EMPLOYMENT_STATUSES = ['Self-Employed', 'Business Owner', 'Artisan / Worker', 'Farmer', 'Salaried Employee', 'Unemployed / Jobseeker'];
const EDUCATION_LEVELS = ['Below Class 8', 'Class 8 Passed', 'Class 10 Passed', 'Class 12 Passed', 'Diploma / ITI', 'Graduate / Post-Graduate'];
const BUSINESS_TYPES = ['Tailoring / Garments', 'Food Processing & Retail', 'Handicrafts & Handlooms', 'Beauty & Wellness', 'Automobile Repair / Services', 'Agriculture & Allied', 'Street Vending & Small Trade', 'Manufacturing / Workshop', 'Other'];

export default function Profile({ navigate, previousPage, previousLabel, onBack }: NavProps) {
  const {
    profile,
    updateProfile,
    addDocument,
    confirmDocumentExtraction,
    deleteDocument,
  } = useProfile();
  const { t } = useLanguage();

  const [isSavedBanner, setIsSavedBanner] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<ProfileDocument | null>(null);
  const [uploadType, setUploadType] = useState('Aadhaar Card');
  const [uploadFileName, setUploadFileName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 3500);
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileName = uploadFileName.trim() || `${uploadType.replace(/\s+/g, '_')}_document.pdf`;
    addDocument({
      type: uploadType,
      name: fileName,
    });
    setUploadFileName('');
    setShowUploadModal(false);
  };

  const getStatusBadge = (status: ProfileDocumentStatus) => {
    switch (status) {
      case 'Verified by user':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'Information extracted':
        return 'bg-blue-500/15 text-[#004b87] dark:text-sky-300 border-blue-500/30';
      case 'Processing':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 animate-pulse';
      case 'Uploaded':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
      case 'Needs confirmation':
        return 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40 font-bold';
      case 'Expired':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
      case 'Missing':
      default:
        return 'bg-slate-200 dark:bg-white/10 theme-text-muted border-transparent';
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (previousPage === 'ai-matcher') {
      navigate('ai-matcher');
    } else {
      navigate('dashboard');
    }
  };

  const backLabel =
    previousPage === 'ai-matcher'
      ? t('backToAiMatcherResults')
      : previousPage === 'dashboard'
      ? t('dashboard')
      : previousLabel
      ? previousLabel
      : t('back');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
          </>
        ) : (
          <>
            <button onClick={() => navigate('dashboard')} className="hover:text-[#004b87] dark:hover:text-sky-300 transition-colors">{t('dashboard')}</button>
            <span>/</span>
          </>
        )}
        <span className="theme-text-main font-semibold">{t('myProfile')}</span>
      </div>

      {/* Profile Overview Header Card */}
      <div className="theme-card rounded-lg p-5 sm:p-6 mb-6 shadow-sm border theme-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#004b87] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              {profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'RK'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="text-xl sm:text-2xl font-bold theme-text-main tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {profile.name || 'Citizen'}
                </h1>
                <span className="text-[10px] font-semibold text-[#004b87] dark:text-sky-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.2 rounded">
                  {t('profile')}
                </span>
              </div>
              <p className="theme-text-muted text-xs">
                {profile.city || 'Coimbatore'}, {profile.state || 'Tamil Nadu'} · {t('beneficiaryCategory')}: {profile.category || 'OBC'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('ai-matcher')}
            className="gov-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto font-bold"
          >
            <span>{t('matchWithProfile')} →</span>
          </button>
        </div>

        {isSavedBanner && (
          <div className="mt-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5 animate-fade-in">
            <span>✓</span>
            <span>{t('docsReady')}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. PERSONAL DETAILS ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="border-b theme-border pb-2.5 mb-3.5">
            <h2 className="text-sm font-bold theme-text-main">
              1. Personal Information
            </h2>
            <p className="theme-text-muted text-xs mt-0.5">Basic identity information as registered on national documents.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Full Beneficiary Name</label>
              <input
                value={profile.name || ''}
                onChange={e => updateProfile({ name: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
                placeholder="e.g. Ravi Kumar"
              />
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Age (Years)</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={e => updateProfile({ age: Number(e.target.value) || undefined })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
                placeholder="e.g. 28"
              />
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Gender</label>
              <select
                value={profile.gender || 'Male'}
                onChange={e => updateProfile({ gender: e.target.value as typeof GENDERS[number] })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ── 2. ADDRESS & LOCATION ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="border-b theme-border pb-2.5 mb-3.5">
            <h2 className="text-sm font-bold theme-text-main">
              2. Address & Location Information
            </h2>
            <p className="theme-text-muted text-xs mt-0.5">Determines urban vs rural capital subsidy slabs and state quota eligibility.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5 mb-3.5">
            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">State / UT</label>
              <select
                value={profile.state || 'Tamil Nadu'}
                onChange={e => updateProfile({ state: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">District / City</label>
              <input
                value={profile.city || profile.district || ''}
                onChange={e => updateProfile({ city: e.target.value, district: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
                placeholder="e.g. Coimbatore"
              />
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Area Classification</label>
              <select
                value={profile.locationType || 'urban'}
                onChange={e => updateProfile({ locationType: e.target.value as 'urban' | 'rural' | 'semi-urban' })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                <option value="urban">Urban Area</option>
                <option value="rural">Rural Area (Higher Subsidy Tier)</option>
                <option value="semi-urban">Semi-Urban</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Permanent Residential Address</label>
            <input
              value={profile.address || ''}
              onChange={e => updateProfile({ address: e.target.value })}
              className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              placeholder="e.g. 14, Gandhi Nagar, Cross Cut Road, Coimbatore - 641012"
            />
          </div>
        </section>

        {/* ── 3. SOCIAL & ECONOMIC DETAILS ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="border-b theme-border pb-2.5 mb-3.5">
            <h2 className="text-sm font-bold theme-text-main">
              3. Social & Economic Information
            </h2>
            <p className="theme-text-muted text-xs mt-0.5">Critical for government reservation quotas and margin money waivers.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Social Category</label>
              <select
                value={profile.category || 'OBC'}
                onChange={e => updateProfile({ category: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Annual Household Income (₹)</label>
              <input
                value={String(profile.annualIncome || '240000')}
                onChange={e => updateProfile({ annualIncome: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
                placeholder="e.g. 240000"
              />
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Employment Status</label>
              <select
                value={profile.employmentStatus || 'Self-Employed'}
                onChange={e => updateProfile({ employmentStatus: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                {EMPLOYMENT_STATUSES.map(es => <option key={es} value={es}>{es}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ── 4. BUSINESS & ENTERPRISE DETAILS ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="border-b theme-border pb-2.5 mb-3.5">
            <h2 className="text-sm font-bold theme-text-main">
              4. Business & Enterprise Details
            </h2>
            <p className="theme-text-muted text-xs mt-0.5">Used for MSME ministry eligibility, tool kit support, and MUDRA loan categories.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Enterprise Sector / Activity</label>
              <select
                value={profile.businessType || profile.occupation || 'Tailoring / Garments'}
                onChange={e => updateProfile({ businessType: e.target.value, occupation: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
              >
                {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Target Financial Assistance Outlay (₹)</label>
              <input
                value={String(profile.loanAmountRequired || '300000')}
                onChange={e => updateProfile({ loanAmountRequired: e.target.value })}
                className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none"
                placeholder="e.g. 300000"
              />
            </div>
          </div>
        </section>

        {/* ── 5. EDUCATIONAL QUALIFICATION ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="border-b theme-border pb-2.5 mb-3.5">
            <h2 className="text-sm font-bold theme-text-main">
              5. Educational Qualification
            </h2>
            <p className="theme-text-muted text-xs mt-0.5">Required for manufacturing enterprise loans exceeding ₹10 Lakhs under PMEGP.</p>
          </div>

          <div>
            <label className="text-xs theme-text-muted font-bold uppercase block mb-1">Highest Qualification Passed</label>
            <select
              value={profile.educationLevel || 'Class 10 Passed'}
              onChange={e => updateProfile({ educationLevel: e.target.value })}
              className="w-full theme-input rounded px-3 py-2 theme-text-main text-xs sm:text-sm outline-none max-w-md"
            >
              {EDUCATION_LEVELS.map(el => <option key={el} value={el}>{el}</option>)}
            </select>
          </div>
        </section>

        {/* ── 6. CITIZEN DOCUMENT LOCKER ── */}
        <section className="theme-card rounded-md p-5 shadow-xs border theme-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border pb-2.5 mb-3.5">
            <div>
              <h2 className="text-sm font-bold theme-text-main">
                6. Citizen Document Locker & Dossier
              </h2>
              <p className="theme-text-muted text-xs mt-0.5">Upload and verify official KYC and certificates for automated scheme cross-checking.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="gov-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>+ Upload New Document</span>
            </button>
          </div>

          {/* Document Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(profile.documents || []).map(doc => (
              <div
                key={doc.id}
                className="theme-card-subtle rounded p-3.5 border theme-border flex flex-col justify-between hover:border-[#004b87] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm">📄</span>
                    <span className={`text-[10px] font-semibold border px-1.5 py-0.2 rounded ${getStatusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="theme-text-main font-bold text-xs mb-0.5 truncate">{doc.name}</h3>
                  <p className="text-[10px] text-[#004b87] dark:text-sky-300 font-semibold mb-2">{doc.type}</p>

                  {doc.extractedData && (
                    <div className="bg-slate-100 dark:bg-black/20 rounded p-2 mb-2 text-[11px] space-y-0.5">
                      <p className="text-[9px] theme-text-muted font-bold uppercase">Extracted Information:</p>
                      {Object.entries(doc.extractedData).map(([k, v]) => (
                        <p key={k} className="theme-text-main truncate">
                          <span className="theme-text-muted">{k}: </span>
                          <span className="font-semibold">{String(v)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t theme-border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedDocPreview(doc)}
                    className="text-[#004b87] dark:text-sky-300 hover:underline font-semibold"
                  >
                    View Details
                  </button>

                  {doc.status === 'Needs confirmation' && (
                    <button
                      type="button"
                      onClick={() => confirmDocumentExtraction(doc.id)}
                      className="px-2 py-0.5 gov-btn-primary text-[10px]"
                    >
                      Confirm ✓
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-600 hover:underline"
                    title="Remove Document"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Save Bar */}
        <div className="sticky bottom-4 z-20 theme-card rounded-md p-3.5 shadow-lg border theme-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs theme-text-muted">
            All modifications update your reusable welfare profile stored securely in your active session.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-6 py-2 gov-btn-primary text-xs font-bold"
            >
              Save Welfare Profile Changes ✓
            </button>
          </div>
        </div>
      </form>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md theme-modal rounded-md p-5 border theme-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b theme-border mb-3.5">
              <h3 className="theme-text-main font-bold text-sm">Upload Citizen Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="theme-text-muted hover:theme-text-main text-sm">✕</button>
            </div>

            <form onSubmit={handleDocumentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1">Document Category</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  className="w-full theme-input rounded p-2 theme-text-main outline-none"
                >
                  {['Aadhaar Card', 'Income Certificate', 'Community / Caste Certificate', 'Bank Passbook / Statement', 'Project Report', 'Udyam MSME Certificate', 'Educational Certificate', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="theme-text-muted font-bold uppercase block mb-1">Document Label / File Name</label>
                <input
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  placeholder="e.g. aadhaar_front_back.pdf"
                  className="w-full theme-input rounded p-2 theme-text-main outline-none"
                />
              </div>

              <div className="border-2 border-dashed theme-border rounded p-4 text-center bg-slate-50 dark:bg-black/20">
                <p className="theme-text-main font-semibold">Select File or Drag & Drop</p>
                <p className="theme-text-muted text-[11px] mt-0.5">PDF, PNG, JPG up to 5MB</p>
              </div>

              <div className="flex gap-2 pt-2 border-t theme-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-1.5 gov-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 gov-btn-primary"
                >
                  Attach to Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg theme-modal rounded-md p-5 border theme-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b theme-border mb-3">
              <div>
                <h3 className="theme-text-main font-bold text-sm">{selectedDocPreview.name}</h3>
                <p className="text-[11px] text-[#004b87] dark:text-sky-300 font-semibold">{selectedDocPreview.type}</p>
              </div>
              <button onClick={() => setSelectedDocPreview(null)} className="theme-text-muted hover:theme-text-main text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-between items-center py-1.5 border-b theme-border">
                <span className="theme-text-muted">Verification Status:</span>
                <span className={`px-2 py-0.2 rounded font-semibold border ${getStatusBadge(selectedDocPreview.status)}`}>
                  {selectedDocPreview.status}
                </span>
              </div>

              {selectedDocPreview.extractedData && (
                <div className="theme-card-subtle rounded p-3 border theme-border space-y-1.5">
                  <p className="font-bold text-[#004b87] dark:text-sky-300 uppercase text-[10px]">Extracted Parameters:</p>
                  {Object.entries(selectedDocPreview.extractedData).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="theme-text-muted">{k}:</span>
                      <span className="theme-text-main font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDocPreview(null)}
              className="w-full py-1.5 gov-btn-primary text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
