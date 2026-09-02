import React, { createContext, useContext, useState, useMemo } from 'react';
import type { UserProfile } from '../types/ai';

/* ==========================================================================
   MOCK / DEMO USER PROFILE DATA
   Notice: This is simulated profile data for frontend prototyping and testing.
   Live authenticated user data will be injected via backend integration.
   ========================================================================== */

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'demo-user-ravi-01',
  name: 'Ravi Kumar',
  age: 28,
  gender: 'Male',
  category: 'SC',
  annualIncome: '₹2,40,000',
  occupation: 'Tailor',
  businessType: 'Tailoring',
  locationType: 'urban',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  loanAmountRequired: '₹3,00,000',
  existingDocuments: ['Aadhaar Card', 'Voter ID'],
  educationLevel: '10th Standard',
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
  getRelevantContext: (query: string) => RelevantProfileResult;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/* ==========================================================================
   Heuristic Profile Field Relevance & Missing Data Engine
   ========================================================================== */

/**
 * Evaluates a user query to identify which profile fields are relevant,
 * extracts only those fields to prevent unnecessary data exposure,
 * and detects any required information missing for the query intent.
 */
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
    lower.includes('eligib');

  const isEmiOrFinancial =
    lower.includes('emi') ||
    lower.includes('calculat') ||
    lower.includes('interest') ||
    lower.includes('amount');

  const isDocumentQuery =
    lower.includes('document') ||
    lower.includes('papers') ||
    lower.includes('certificate') ||
    lower.includes('aavanam');

  const isPartnerQuery =
    lower.includes('partner') ||
    lower.includes('bank') ||
    lower.includes('nearby') ||
    lower.includes('office');

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

    if (profile.city || profile.locationType) {
      relevantLabels.push('Location');
      relevantContext.city = profile.city;
      relevantContext.locationType = profile.locationType;
    } else {
      missingFields.push({ field: 'city', label: 'City / District', actionText: 'Set Location' });
    }

    if (profile.businessType) {
      relevantContext.businessType = profile.businessType;
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
    if (profile.existingDocuments && profile.existingDocuments.length > 0) {
      relevantLabels.push('Available documents');
      relevantContext.existingDocuments = profile.existingDocuments;
    }
  }

  // 4. Partner Locator Queries
  else if (isPartnerQuery) {
    if (profile.city) {
      relevantLabels.push('Location');
      relevantContext.city = profile.city;
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
   Provider Component
   ========================================================================== */

export const ProfileProvider: React.FC<{ children: React.ReactNode; initialProfile?: UserProfile }> = ({
  children,
  initialProfile,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile || MOCK_USER_PROFILE);
  const [isMock] = useState(true);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const resetToMock = () => {
    setProfile(MOCK_USER_PROFILE);
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
    // Graceful fallback if used outside of ProfileProvider
    return {
      profile: MOCK_USER_PROFILE,
      isMock: true,
      updateProfile: () => {},
      resetToMock: () => {},
      getRelevantContext: (q: string) => extractRelevantProfileContext(q, MOCK_USER_PROFILE),
    };
  }
  return context;
}

export default ProfileContext;
