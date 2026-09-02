import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, ProfileDocument, ProfileDocumentStatus } from '../types/ai';

/* ==========================================================================
   DEFAULT / DEMO USER PROFILE DATA
   Provides a realistic baseline profile that can be viewed, edited, or expanded.
   ========================================================================== */

export const INITIAL_DOCUMENTS: ProfileDocument[] = [
  {
    id: 'doc-aadhaar-01',
    type: 'Aadhaar Card',
    name: 'Aadhaar_Ravi_Kumar.pdf',
    status: 'Verified by user',
    uploadedAt: '2026-08-10',
    verifiedAt: '2026-08-10',
    extractedData: {
      'Full Name': 'Ravi Kumar',
      'Date of Birth': '14/05/1998 (Age 28)',
      'Gender': 'Male',
      'Address': '42, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
    },
  },
  {
    id: 'doc-income-01',
    type: 'Income Certificate',
    name: 'Income_Certificate_2026.pdf',
    status: 'Verified by user',
    uploadedAt: '2026-08-12',
    verifiedAt: '2026-08-12',
    extractedData: {
      'Annual Income': '₹2,40,000',
      'Issuing Authority': 'Tahsildar, Coimbatore North',
      'Certificate No': 'TN-REV-2026-88492',
    },
  },
  {
    id: 'doc-caste-01',
    type: 'Community Certificate',
    name: 'OBC_Community_Cert.pdf',
    status: 'Information extracted',
    uploadedAt: '2026-08-20',
    extractedData: {
      'Social Category': 'OBC',
      'Issuing State': 'Tamil Nadu',
      'Validity': 'Permanent',
    },
  },
  {
    id: 'doc-bank-01',
    type: 'Bank Passbook',
    name: 'Canara_Bank_Passbook.pdf',
    status: 'Uploaded',
    uploadedAt: '2026-08-28',
    extractedData: {
      'Bank Name': 'Canara Bank',
      'Account Type': 'Savings Account',
      'Branch': 'Gandhipuram, Coimbatore',
    },
  },
];

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'demo-user-ravi-01',
  name: 'Ravi Kumar',
  age: 28,
  dateOfBirth: '1998-05-14',
  gender: 'Male',
  category: 'OBC',
  differentlyAbled: false,
  maritalStatus: 'Married',
  annualIncome: '240000',
  occupation: 'Tailor / Garment Maker',
  employmentStatus: 'Self-Employed',
  businessType: 'Tailoring / Garments',
  locationType: 'urban',
  city: 'Coimbatore',
  district: 'Coimbatore',
  state: 'Tamil Nadu',
  address: '42, Cross Cut Road, Gandhipuram, Coimbatore',
  pincode: '641012',
  loanAmountRequired: '300000',
  financialPreferences: 'Term Loan with Capital Subsidy & Moratorium',
  educationLevel: '10th Standard',
  existingDocuments: ['Aadhaar Card', 'Income Certificate', 'Community Certificate', 'Bank Passbook'],
  documents: INITIAL_DOCUMENTS,
};

/* ==========================================================================
   Profile Context Types & Interfaces
   ========================================================================== */

export interface MissingProfileField {
  field: keyof UserProfile;
  label: string;
  actionText: string;
  helperText?: string;
}

export interface RelevantProfileResult {
  relevantFieldLabels: string[];
  relevantContext: Partial<UserProfile>;
  missingFields: MissingProfileField[];
  hasContext: boolean;
}

export interface ProfileContextValue {
  profile: UserProfile;
  isMock: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetToMock: () => void;
  addDocument: (doc: { type: string; name: string; fileUrl?: string; extractedData?: Record<string, string> }) => void;
  updateDocumentStatus: (docId: string, status: ProfileDocumentStatus, extractedData?: Record<string, string>) => void;
  confirmDocumentExtraction: (docId: string) => void;
  deleteDocument: (docId: string) => void;
  getRelevantContext: (query: string) => RelevantProfileResult;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/* ==========================================================================
   Heuristic Profile Field Relevance & Missing Data Engine
   ========================================================================== */

export function extractRelevantProfileContext(query: string, profile: UserProfile): RelevantProfileResult {
  const lower = query.toLowerCase();

  const isBusinessOrScheme =
    lower.includes('tailoring') ||
    lower.includes('business') ||
    lower.includes('scheme') ||
    lower.includes('loan') ||
    lower.includes('kadan') ||
    lower.includes('assistance') ||
    lower.includes('help') ||
    lower.includes('thozhil') ||
    lower.includes('start') ||
    lower.includes('expand') ||
    lower.includes('eligib');

  const isEmiOrFinancial =
    lower.includes('emi') ||
    lower.includes('calculat') ||
    lower.includes('interest') ||
    lower.includes('amount') ||
    lower.includes('subsidy');

  const isDocumentQuery =
    lower.includes('document') ||
    lower.includes('papers') ||
    lower.includes('certificate') ||
    lower.includes('aavanam') ||
    lower.includes('proof');

  const isPartnerQuery =
    lower.includes('partner') ||
    lower.includes('bank') ||
    lower.includes('nearby') ||
    lower.includes('office') ||
    lower.includes('branch');

  const relevantLabels: string[] = [];
  const relevantContext: Partial<UserProfile> = {};
  const missingFields: MissingProfileField[] = [];

  // 1. Business / Scheme / Eligibility Queries
  if (isBusinessOrScheme) {
    if (profile.category) {
      relevantLabels.push('Category');
      relevantContext.category = profile.category;
    } else {
      missingFields.push({ field: 'category', label: 'Social Category', actionText: 'Select Category' });
    }

    if (profile.annualIncome) {
      relevantLabels.push('Annual income');
      relevantContext.annualIncome = profile.annualIncome;
    } else {
      missingFields.push({ field: 'annualIncome', label: 'Annual Household Income', actionText: 'Enter Income' });
    }

    if (profile.occupation) {
      relevantLabels.push('Occupation');
      relevantContext.occupation = profile.occupation;
    }

    if (profile.city || profile.district || profile.locationType) {
      relevantLabels.push('Location');
      relevantContext.city = profile.city || profile.district;
      relevantContext.state = profile.state;
      relevantContext.locationType = profile.locationType;
    } else {
      missingFields.push({ field: 'city', label: 'City / District', actionText: 'Set Location' });
    }

    if (profile.businessType) {
      relevantContext.businessType = profile.businessType;
    }

    if (profile.age) {
      relevantLabels.push('Age');
      relevantContext.age = profile.age;
    }
  }

  // 2. Financial / EMI Queries
  else if (isEmiOrFinancial) {
    if (profile.loanAmountRequired) {
      relevantLabels.push('Loan requirement');
      relevantContext.loanAmountRequired = profile.loanAmountRequired;
    }
    if (profile.annualIncome) {
      relevantLabels.push('Annual income');
      relevantContext.annualIncome = profile.annualIncome;
    }
  }

  // 3. Document Queries
  else if (isDocumentQuery) {
    if (profile.category) {
      relevantLabels.push('Category');
      relevantContext.category = profile.category;
    }
    if (profile.documents && profile.documents.length > 0) {
      relevantLabels.push('Available verified documents');
      relevantContext.existingDocuments = profile.documents.map(d => d.type);
    }
  }

  // 4. Partner Locator Queries
  else if (isPartnerQuery) {
    if (profile.city || profile.district) {
      relevantLabels.push('Location');
      relevantContext.city = profile.city || profile.district;
    }
  }

  return {
    relevantFieldLabels: relevantLabels,
    relevantContext,
    missingFields,
    hasContext: relevantLabels.length > 0,
  };
}

/* ==========================================================================
   Provider Component with LocalStorage Persistence
   ========================================================================== */

const PROFILE_STORAGE_KEY = 'sahaya_welfare_user_profile';

export const ProfileProvider: React.FC<{ children: React.ReactNode; initialProfile?: UserProfile }> = ({
  children,
  initialProfile,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (initialProfile) return initialProfile;
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...MOCK_USER_PROFILE, ...parsed };
      }
    } catch {
      // Ignore localStorage error
    }
    return MOCK_USER_PROFILE;
  });

  const [isMock] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore localStorage save error
    }
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const resetToMock = () => {
    setProfile(MOCK_USER_PROFILE);
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const addDocument = (doc: { type: string; name: string; fileUrl?: string; extractedData?: Record<string, string> }) => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc: ProfileDocument = {
      id: newDocId,
      type: doc.type,
      name: doc.name,
      status: 'Uploaded',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileUrl: doc.fileUrl,
      extractedData: doc.extractedData,
    };

    setProfile(prev => {
      const existing = prev.documents || [];
      return {
        ...prev,
        documents: [newDoc, ...existing],
        existingDocuments: Array.from(new Set([...(prev.existingDocuments || []), doc.type])),
      };
    });

    // Simulate OCR intelligence extraction after 800ms
    setTimeout(() => {
      setProfile(prev => {
        const docs = (prev.documents || []).map(d => {
          if (d.id === newDocId) {
            let extracted: Record<string, string> = {};
            if (doc.type.includes('Aadhaar')) {
              extracted = { 'Full Name': prev.name, 'Age': `${prev.age || 28} years`, 'Status': 'Match Verified' };
            } else if (doc.type.includes('Income')) {
              extracted = { 'Annual Income': `₹${Number(prev.annualIncome || 240000).toLocaleString('en-IN')}`, 'Issuing Authority': 'State Revenue Department' };
            } else if (doc.type.includes('Community') || doc.type.includes('Caste')) {
              extracted = { 'Category': prev.category || 'OBC', 'Validity': 'Permanent' };
            } else if (doc.type.includes('Bank')) {
              extracted = { 'Bank Account': 'Savings Account Active', 'Verification': 'Linked via IFSC' };
            } else {
              extracted = { 'Document Type': doc.type, 'Status': 'Ready for verification' };
            }

            return {
              ...d,
              status: 'Information extracted' as ProfileDocumentStatus,
              extractedData: extracted,
            };
          }
          return d;
        });
        return { ...prev, documents: docs };
      });
    }, 800);
  };

  const updateDocumentStatus = (docId: string, status: ProfileDocumentStatus, extractedData?: Record<string, string>) => {
    setProfile(prev => {
      const docs = (prev.documents || []).map(d => {
        if (d.id === docId) {
          return {
            ...d,
            status,
            extractedData: extractedData || d.extractedData,
            verifiedAt: status === 'Verified by user' ? new Date().toISOString().split('T')[0] : d.verifiedAt,
          };
        }
        return d;
      });
      return { ...prev, documents: docs };
    });
  };

  const confirmDocumentExtraction = (docId: string) => {
    setProfile(prev => {
      const doc = (prev.documents || []).find(d => d.id === docId);
      const docs = (prev.documents || []).map(d => {
        if (d.id === docId) {
          return {
            ...d,
            status: 'Verified by user' as ProfileDocumentStatus,
            verifiedAt: new Date().toISOString().split('T')[0],
          };
        }
        return d;
      });

      // Synchronize extracted data to user profile if applicable
      const updates: Partial<UserProfile> = { documents: docs };
      if (doc?.extractedData) {
        if (doc.extractedData['Annual Income']) {
          const incStr = doc.extractedData['Annual Income'].replace(/[^0-9]/g, '');
          if (incStr) updates.annualIncome = incStr;
        }
        if (doc.extractedData['Social Category'] || doc.extractedData['Category']) {
          updates.category = doc.extractedData['Social Category'] || doc.extractedData['Category'];
        }
      }

      return { ...prev, ...updates };
    });
  };

  const deleteDocument = (docId: string) => {
    setProfile(prev => {
      const removed = (prev.documents || []).find(d => d.id === docId);
      const docs = (prev.documents || []).filter(d => d.id !== docId);
      const existingTypes = docs.map(d => d.type);
      return {
        ...prev,
        documents: docs,
        existingDocuments: removed ? prev.existingDocuments?.filter(t => t !== removed.type || existingTypes.includes(t)) : prev.existingDocuments,
      };
    });
  };

  const getRelevantContext = (query: string) => {
    return extractRelevantProfileContext(query, profile);
  };

  const value = useMemo(
    () => ({
      profile,
      isMock,
      updateProfile,
      resetToMock,
      addDocument,
      updateDocumentStatus,
      confirmDocumentExtraction,
      deleteDocument,
      getRelevantContext,
    }),
    [profile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

/* ==========================================================================
   Consumer Hook
   ========================================================================== */

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    return {
      profile: MOCK_USER_PROFILE,
      isMock: true,
      updateProfile: () => {},
      resetToMock: () => {},
      addDocument: () => {},
      updateDocumentStatus: () => {},
      confirmDocumentExtraction: () => {},
      deleteDocument: () => {},
      getRelevantContext: (q: string) => extractRelevantProfileContext(q, MOCK_USER_PROFILE),
    };
  }
  return context;
}

export default ProfileContext;
