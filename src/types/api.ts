import type { Scheme, Partner } from '../types';
import type {
  AIMessage,
  AISchemeCard,
  AgentProgressStep,
  DetectedLanguage,
  PartnerMatch,
  UserProfile,
  AIPageContext,
} from './ai';

/* ==========================================================================
   1. AI Assistant & Voice Endpoints
   ========================================================================== */

/**
 * POST /api/ai/chat - Request
 */
export interface AIChatRequest {
  message: string;
  conversationId?: string;
  userProfile?: UserProfile;
  profileContext?: Partial<UserProfile>;
  relevantProfileFields?: string[];
  pageContext?: AIPageContext;
  isVoiceInput?: boolean;
  history?: Pick<AIMessage, 'role' | 'text'>[];
}

/**
 * POST /api/ai/chat - Response
 */
export interface AIChatResponse {
  conversationId: string;
  messageId: string;
  text: string;
  detectedLanguage?: DetectedLanguage;
  progressSteps?: AgentProgressStep[];
  schemeCards?: AISchemeCard[];
  partnerMatches?: PartnerMatch[];
  usedProfileFields?: string[];
  missingProfileFields?: { field: string; label: string; actionText?: string }[];
  audioUrl?: string; // Provisional: audio streaming URL
}

/**
 * POST /api/voice/transcribe - Request
 */
export interface VoiceTranscribeRequest {
  audioBlob?: Blob;
  audioBase64?: string;
  languageHint?: string;
}

/**
 * POST /api/voice/transcribe - Response
 */
export interface VoiceTranscribeResponse {
  transcription: string;
  detectedLanguage?: DetectedLanguage;
  confidence: number;
}

/**
 * POST /api/voice/synthesize - Request
 */
export interface VoiceSynthesizeRequest {
  text: string;
  language?: string;
  voiceGender?: 'male' | 'female' | 'neutral';
}

/**
 * POST /api/voice/synthesize - Response
 */
export interface VoiceSynthesizeResponse {
  audioUrl: string;
  durationSeconds: number;
}

/* ==========================================================================
   2. Schemes Catalog Endpoints
   ========================================================================== */

/**
 * GET /api/schemes - Request query parameters
 */
export interface SchemesListParams {
  category?: string;
  type?: string;
  search?: string;
  state?: string;
  page?: number;
  limit?: number;
}

/**
 * GET /api/schemes - Response
 */
export interface SchemesListResponse {
  schemes: Scheme[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * GET /api/schemes/{id} - Response
 */
export type SchemeDetailResponse = Scheme;

/* ==========================================================================
   3. AI Matching & Eligibility Endpoints
   ========================================================================== */

/**
 * POST /api/matching - Request
 */
export interface MatchingRequest {
  purpose: string;
  location: string;
  category: string;
  income?: string | number;
  age?: number;
  business?: string;
  amount?: string | number;
  state?: string;
  userProfile?: Partial<UserProfile>;
}

/**
 * Matched scheme item returned by the backend matching engine
 */
export interface MatchedSchemeResult extends Scheme {
  match: number; // Relevance score percentage (0-100)
  eligibility: 'Eligible' | 'Likely Eligible' | 'Needs Review';
  why: string;
  matchedCriteria?: string[]; // Provisional: backend criteria checklist
  unmatchedCriteria?: string[]; // Provisional
}

/**
 * POST /api/matching - Response
 */
export interface MatchingResponse {
  matches: MatchedSchemeResult[];
  totalMatches: number;
  disclaimer: string;
}

/**
 * POST /api/eligibility/check - Request
 */
export interface EligibilityCheckRequest {
  schemeId: string;
  age: number;
  category: string;
  income: number;
  location: 'rural' | 'urban' | string;
  gender?: string;
  occupation?: string;
  hasExistingBusiness?: boolean;
}

/**
 * POST /api/eligibility/check - Response
 */
export interface EligibilityCheckResponse {
  schemeId: string;
  status: 'Eligible' | 'Likely Eligible' | 'Not Eligible' | 'Needs Review';
  score: number;
  reasons: string[];
  criteriaBreakdown: {
    criterion: string;
    satisfied: boolean;
    reason?: string;
  }[];
  disclaimer: string;
}

/* ==========================================================================
   4. Financial Calculation Endpoint
   ========================================================================== */

/**
 * POST /api/financial/calculate - Request
 */
export interface FinancialCalculateRequest {
  schemeId?: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  category?: string;
  locationType?: 'rural' | 'urban';
}

/**
 * POST /api/financial/calculate - Response
 */
export interface FinancialCalculateResponse {
  monthlyEMI: number;
  totalInterest: number;
  totalRepayment: number;
  subsidyAmount?: number;
  subsidyPercentage?: number;
  effectiveLoanAmount?: number;
  effectiveMonthlyEMI?: number;
}

/* ==========================================================================
   5. Scheme Documents Endpoint
   ========================================================================== */

/**
 * GET /api/schemes/{id}/documents - Response
 */
export interface SchemeDocumentsResponse {
  schemeId: string;
  schemeName: string;
  mandatoryDocuments: {
    id: string;
    name: string;
    category: 'identity' | 'income' | 'business' | 'address' | 'other';
    description?: string;
    issuingAuthority?: string;
  }[];
  optionalDocuments?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  }[];
}

/* ==========================================================================
   6. Authorized Partners Endpoints
   ========================================================================== */

/**
 * GET /api/partners/nearby - Request query parameters
 */
export interface NearbyPartnersParams {
  latitude?: number;
  longitude?: number;
  city?: string;
  radiusKm?: number;
  schemeId?: string;
}

/**
 * GET /api/partners/nearby - Response
 */
export interface NearbyPartnersResponse {
  partners: Partner[];
  total: number;
}

/**
 * GET /api/partners/locator - Request query parameters
 */
export interface PartnerLocatorParams {
  state?: string;
  district?: string;
  city?: string;
  schemeType?: string;
  search?: string;
}

/**
 * GET /api/partners/locator - Response
 */
export interface PartnerLocatorResponse {
  partners: Partner[];
  total: number;
}
