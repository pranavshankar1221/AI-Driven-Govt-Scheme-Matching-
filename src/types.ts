export type Page =
  | 'home' | 'catalog' | 'scheme-details' | 'ai-matcher'
  | 'eligibility' | 'calculator' | 'documents' | 'partners'
  | 'guidance' | 'dashboard' | 'conversations' | 'faq' | 'login' | 'profile';

export interface Scheme {
  id: string;
  name: string;
  organization: string;
  type: string;
  purpose: string;
  eligibilitySummary: string;
  financialAssistance: string;
  minAge: number;
  maxAge: number;
  maxIncome: number;
  categories: string[];
  description: string;
  benefits: string[];
  documents: string[];
  applicationProcess: string[];
  badge?: string;
}

export interface Partner {
  id: string;
  name: string;
  type: string;
  distance: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  schemes: string[];
  hours: string;
}

export interface NavProps {
  navigate: (page: Page, schemeId?: string, sourceContext?: { fromPage?: Page; fromLabel?: string }) => void;
  currentPage: Page;
  previousPage?: Page;
  previousLabel?: string;
  onBack?: () => void;
  fromPage?: Page;
  fromLabel?: string;
  selectedSchemeId?: string;
}
