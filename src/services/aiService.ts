import type {
  AIMessage,
  AISchemeCard,
  AgentProgressStep,
  AIPageContext,
  DetectedLanguage,
  PartnerMatch,
  UserProfile,
} from '../types/ai';
import { detectLanguage } from './languageDetector';

/* ==========================================================================
   Backend API Request & Response Contracts
   (Pre-wired for future backend implementation: POST /api/ai/chat,
   POST /api/voice/transcribe, POST /api/voice/synthesize)
   ========================================================================== */

/**
 * Request payload for POST /api/ai/chat
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
 * Response payload from POST /api/ai/chat
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
  audioUrl?: string;
}

/**
 * Request payload for POST /api/voice/transcribe
 */
export interface VoiceTranscribeRequest {
  audioBlob?: Blob;
  audioBase64?: string;
  languageHint?: string;
}

/**
 * Response payload from POST /api/voice/transcribe
 */
export interface VoiceTranscribeResponse {
  transcription: string;
  detectedLanguage?: DetectedLanguage;
  confidence: number;
}

/**
 * Request payload for POST /api/voice/synthesize
 */
export interface VoiceSynthesizeRequest {
  text: string;
  language?: string;
  voiceGender?: 'male' | 'female' | 'neutral';
}

/**
 * Response payload from POST /api/voice/synthesize
 */
export interface VoiceSynthesizeResponse {
  audioUrl: string;
  durationSeconds: number;
}

/* ==========================================================================
   Default Progress Steps Template
   ========================================================================== */

export const DEFAULT_AGENT_PROGRESS_STEPS: AgentProgressStep[] = [
  { id: '1', label: 'Understanding your requirement', status: 'completed' },
  { id: '2', label: 'Checking your profile', status: 'completed' },
  { id: '3', label: 'Checking eligibility criteria', status: 'completed' },
  { id: '4', label: 'Finding suitable schemes', status: 'completed' },
  { id: '5', label: 'Checking financial fit', status: 'completed' },
  { id: '6', label: 'Finding nearby partners', status: 'completed' },
];

/* ==========================================================================
   Mock Response Data
   ========================================================================== */

const MOCK_SCHEME_CARDS: Record<string, AISchemeCard[]> = {
  tailoring: [
    {
      id: 'pmegp',
      name: 'PM Employment Generation Programme (PMEGP)',
      match: 94,
      eligibility: 'Eligible',
      why: 'Tailoring qualifies as a micro manufacturing enterprise. 35% subsidy available for rural/special category applicants.',
      assistance: 'Up to ₹25 Lakhs | 35% Subsidy',
      explanation: {
        summary: 'Strong match based on business activity and category eligibility.',
        matchedCriteria: [
          'Business Category: Micro Manufacturing (Tailoring)',
          'Location Tier Supported',
          'Subsidy Range: 15% - 35%',
        ],
        disclaimer: 'Sahaya AI provides guidance only — not official approval.',
      },
    },
    {
      id: 'mudra',
      name: 'Pradhan Mantri MUDRA Yojana',
      match: 88,
      eligibility: 'Eligible',
      why: 'Your business fits the Kishore category (₹50K–₹5L). No collateral needed with minimal documentation.',
      assistance: 'Up to ₹5 Lakhs | No Collateral',
      explanation: {
        summary: 'High suitability for small enterprise credit without collateral requirement.',
        matchedCriteria: [
          'No Collateral Required',
          'Tier: Kishore (₹50,000 to ₹5,00,000)',
        ],
        disclaimer: 'Sahaya AI provides guidance only — not official approval.',
      },
    },
    {
      id: 'standup',
      name: 'Stand-Up India Scheme',
      match: 72,
      eligibility: 'Likely Eligible',
      why: 'Applicable if you are from SC/ST category or a woman entrepreneur establishing a greenfield venture.',
      assistance: '₹10L to ₹1 Crore | 75% Coverage',
      explanation: {
        summary: 'Conditional match based on enterprise status and demographic category.',
        matchedCriteria: ['Composite Loan: 75% Project Cost'],
        missingInformation: ['Greenfield venture status confirmation'],
        disclaimer: 'Sahaya AI provides guidance only — not official approval.',
      },
    },
  ],
  loan: [
    {
      id: 'mudra',
      name: 'PM MUDRA Yojana',
      match: 92,
      eligibility: 'Eligible',
      why: 'Easiest access — no collateral, minimal documents. Kishore/Tarun tier fits requirements.',
      assistance: 'Up to ₹10 Lakhs | Low Interest',
      explanation: {
        summary: 'Best fit for immediate small business capital.',
        matchedCriteria: ['Collateral-free credit', 'Low processing fees'],
        disclaimer: 'Sahaya AI provides guidance only — not official approval.',
      },
    },
    {
      id: 'pmegp',
      name: 'PMEGP',
      match: 85,
      eligibility: 'Eligible',
      why: 'Suitable for new enterprise. 25–35% capital subsidy reduces effective loan burden.',
      assistance: 'Up to ₹25 Lakhs | 25% Subsidy',
      explanation: {
        summary: 'Subsidized loan programme suitable for new project setups.',
        matchedCriteria: ['Capital subsidy eligible'],
        disclaimer: 'Sahaya AI provides guidance only — not official approval.',
      },
    },
  ],
};

/* ==========================================================================
   Service Implementation
   ========================================================================== */

class AIService {
  private useMock: boolean = true;
  private apiBaseUrl: string = '/api';

  /**
   * Configure service mode (mock vs live backend API)
   */
  public setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }

  /**
   * Send a chat message to the AI Assistant
   * Target endpoint: POST /api/ai/chat
   */
  public async sendChatMessage(request: AIChatRequest): Promise<AIChatResponse> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) {
          throw new Error(`AI Chat API error: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as AIChatResponse;
      } catch (err) {
        console.warn('Backend API unavailable, falling back to mock:', err);
      }
    }

    // Mock implementation with slight delay to mimic backend inference
    await new Promise(resolve => setTimeout(resolve, 800));

    const lower = request.message.toLowerCase();
    const isTailoring = lower.includes('tailoring') || lower.includes('silai') || lower.includes('தையல்');
    const isLoan = lower.includes('loan') || lower.includes('கடன்') || lower.includes('lakh') || lower.includes('ரூபாய்');

    let responseText = `I understand you're asking about government schemes and assistance. Could you tell me more about your business type, location, or required loan amount?`;
    let cards: AISchemeCard[] | undefined = undefined;

    if (isTailoring) {
      responseText = `Sure! உங்கள் tailoring business-க்கு பொருத்தமான government schemes-ஐ analyze செய்தேன்.\n\nHere are the top matching government schemes for you:`;
      cards = MOCK_SCHEME_CARDS.tailoring;
    } else if (isLoan) {
      responseText = `I can help you find suitable government loan schemes. Based on your requirement, here are the top matching programmes:`;
      cards = MOCK_SCHEME_CARDS.loan;
    } else if (request.pageContext?.page === 'scheme-details' && request.pageContext.scheme) {
      responseText = `You're viewing **${request.pageContext.scheme.name}**. I can help you check your eligibility criteria, calculate financial assistance, find required documents, or locate authorized channel partners.`;
    }

    const detectedLang = detectLanguage(request.message);

    return {
      conversationId: request.conversationId || `conv-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      text: responseText,
      schemeCards: cards,
      progressSteps: DEFAULT_AGENT_PROGRESS_STEPS,
      detectedLanguage: detectedLang,
    };
  }

  /**
   * Transcribe an audio input buffer to text
   * Target endpoint: POST /api/voice/transcribe
   */
  public async transcribeAudio(request: VoiceTranscribeRequest): Promise<VoiceTranscribeResponse> {
    if (!this.useMock && request.audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', request.audioBlob);
        if (request.languageHint) formData.append('languageHint', request.languageHint);

        const res = await fetch(`${this.apiBaseUrl}/voice/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Voice transcribe API error: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as VoiceTranscribeResponse;
      } catch (err) {
        console.warn('Backend Voice API unavailable, falling back to mock:', err);
      }
    }

    // Mock response simulating transcription
    await new Promise(resolve => setTimeout(resolve, 600));

    const sampleTranscription = 'Enakku tailoring business start panna 3 lakh loan venum. Coimbatore-la irukken.';
    const detectedLang = detectLanguage(sampleTranscription);

    return {
      transcription: sampleTranscription,
      detectedLanguage: detectedLang,
      confidence: detectedLang.confidence,
    };
  }

  /**
   * Synthesize text to spoken audio
   * Target endpoint: POST /api/voice/synthesize
   */
  public async synthesizeSpeech(request: VoiceSynthesizeRequest): Promise<VoiceSynthesizeResponse> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/voice/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) {
          throw new Error(`Voice synthesize API error: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as VoiceSynthesizeResponse;
      } catch (err) {
        console.warn('Backend Speech API unavailable, falling back to mock:', err);
      }
    }

    // Mock response simulating synthesized audio metadata
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      audioUrl: '', // In future: URL to synthesized audio stream / Blob URL
      durationSeconds: 4.5,
    };
  }
}

export const aiService = new AIService();
export default aiService;
