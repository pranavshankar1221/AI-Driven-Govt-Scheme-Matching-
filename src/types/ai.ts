import type { Page, Scheme } from '../types';

/**
 * Supported message roles in AI chat
 */
export type AIMessageRole = 'user' | 'ai' | 'system';

/**
 * Status of individual reasoning/execution steps in the AI Agent pipeline
 */
export type AgentProgressStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * A discrete progress step in the multi-stage AI reasoning sequence
 */
export interface AgentProgressStep {
  id: string;
  label: string;
  status: AgentProgressStatus;
  detail?: string;
}

/**
 * Lifecycle states of the push-to-talk voice recording pipeline
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'playing' | 'paused' | 'error';

/**
 * Lifecycle states of the live full-duplex voice call session
 */
export type CallState =
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'ended';

/**
 * User profile schema for profile-aware AI scheme matching and context
 */
export interface UserProfile {
  id?: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | string;
  category?: 'General' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'Minorities' | 'Women' | 'Ex-Servicemen' | string;
  annualIncome?: number | string;
  occupation?: string;
  locationType?: 'urban' | 'rural' | 'semi-urban';
  city?: string;
  state?: string;
  businessType?: string;
  loanAmountRequired?: number | string;
  existingDocuments?: string[];
  educationLevel?: string;
}

/**
 * Multi-lingual and code-mixed language detection results
 */
export interface DetectedLanguage {
  primary: string; // e.g. 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'English'
  secondary?: string; // e.g. 'English' for code-mixed Tanglish/Hinglish
  displayName: string; // e.g. 'Tamil + English'
  confidence: number; // 0 to 1
  isMixed: boolean;
}

/**
 * Structured explainability report for why a scheme was recommended
 */
export interface MatchExplanation {
  summary: string;
  matchedCriteria: string[]; // e.g. ['Tailoring qualifies as micro-manufacturing', 'OBC Category eligible', 'Urban Coimbatore tier supported']
  unmatchedCriteria?: string[];
  missingInformation?: string[]; // Attributes needed to confirm eligibility
  disclaimer: string; // e.g. 'Sahaya AI provides guidance only — official approval is determined by implementing agencies.'
}

/**
 * Contextual authorized partner recommendation within AI conversations
 */
export interface PartnerMatch {
  id: string;
  name: string;
  type: string; // e.g. 'Public Sector Bank', 'District Industries Centre'
  distance: string; // e.g. '0.8 km'
  address: string;
  phone: string;
  rating: number;
  reviewCount?: number;
  schemesSupported: string[];
  isNearest?: boolean;
  status?: 'Open' | 'Closed' | 'Operational';
  recommendationReason?: string;
}

/**
 * Rich scheme recommendation card data model
 */
export interface AISchemeCard {
  id: string;
  name: string;
  match: number;
  eligibility: 'Eligible' | 'Likely Eligible' | 'Needs Review';
  why: string;
  assistance: string;
  explanation?: MatchExplanation;
  partnerRecommendations?: PartnerMatch[];
}

/**
 * Alias for AISchemeCard for backwards compatibility
 */
export type SchemeCard = AISchemeCard;

/**
 * Current page and navigation context provided to the AI assistant
 */
export interface AIPageContext {
  page: Page;
  schemeId?: string;
  scheme?: Scheme;
  calculatorValues?: {
    amount?: number;
    tenure?: number;
    rate?: number;
    subsidyPct?: number;
    emi?: number;
  };
  activeFilters?: Record<string, unknown>;
}

/**
 * Full message structure for the AI conversational stream
 */
export interface AIMessage {
  id: string;
  role: AIMessageRole;
  text: string;
  lang?: string;
  detectedLang?: DetectedLanguage;
  timestamp: Date;
  isVoice?: boolean;
  schemeCards?: AISchemeCard[];
  progressSteps?: AgentProgressStep[];
  usedProfileFields?: string[];
  missingProfileFields?: { field: string; label: string; actionText?: string }[];
  processing?: boolean;
  playingVoice?: boolean;
  audioUrl?: string;
}

/**
 * Alias for AIMessage for backwards compatibility
 */
export type Message = AIMessage;

/**
 * Transcript entry for voice call conversations
 */
export interface VoiceTranscriptEntry {
  role: 'user' | 'ai';
  text: string;
  time: string;
}
