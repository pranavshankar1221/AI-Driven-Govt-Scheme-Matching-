import type {
  AIChatRequest,
  AIChatResponse,
  VoiceTranscribeRequest,
  VoiceTranscribeResponse,
  VoiceSynthesizeRequest,
  VoiceSynthesizeResponse,
} from '../types/api';
import type { AISchemeCard, AgentProgressStep } from '../types/ai';
import { apiFetch } from './api';
import { detectLanguage } from './languageDetector';

/* ==========================================================================
   Isolated Development Mock Responses
   Notice: Used solely for local prototyping when backend API is disconnected.
   All live processing is executed on the backend.
   ========================================================================== */

const DEV_PROGRESS_STEPS: AgentProgressStep[] = [
  { id: '1', label: 'Understanding your requirement', status: 'completed' },
  { id: '2', label: 'Checking your profile', status: 'completed' },
  { id: '3', label: 'Checking eligibility criteria', status: 'completed' },
  { id: '4', label: 'Finding suitable schemes', status: 'completed' },
  { id: '5', label: 'Checking financial fit', status: 'completed' },
];

const DEV_SCHEME_CARDS: Record<string, AISchemeCard[]> = {
  tailoring: [
    {
      id: 'pmegp',
      name: 'Prime Minister Employment Generation Programme (PMEGP)',
      match: 94,
      eligibility: 'Eligible',
      why: 'Tailoring qualifies as a micro manufacturing enterprise. 35% capital subsidy is available for SC/ST and special category entrepreneurs.',
      assistance: 'Up to ₹25 Lakhs | 35% Capital Subsidy',
      explanation: {
        summary: 'Tailoring qualifies as a micro-manufacturing enterprise eligible for capital subsidy.',
        matchedCriteria: [
          'Income criteria matched: No upper ceiling',
          'Category matched: SC category eligible for 35% special subsidy',
          'Purpose matched: Micro-enterprise tailoring setup',
          'Location supported: Coimbatore urban branch network',
        ],
        disclaimer: 'Guidance based on available information. Final eligibility is subject to official verification.',
      },
    },
    {
      id: 'mudra',
      name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
      match: 88,
      eligibility: 'Eligible',
      why: 'Your business fits the Kishore category (₹50K–₹5L). No collateral or third-party guarantee required.',
      assistance: 'Up to ₹5 Lakhs | Zero Collateral',
      explanation: {
        summary: 'Working capital tier fits ₹3 Lakhs loan requirement without collateral.',
        matchedCriteria: [
          'Purpose matched: Small business trade and tailoring equipment',
          'Tier matched: Kishore (₹50,000 to ₹5,00,000)',
          'Zero collateral or third-party guarantee required',
        ],
        disclaimer: 'Guidance based on available information. Final eligibility is subject to official verification.',
      },
    },
    {
      id: 'standup',
      name: 'Stand-Up India Scheme',
      match: 72,
      eligibility: 'Likely Eligible',
      why: 'Special bank financing from ₹10 Lakhs to ₹1 Crore for SC/ST entrepreneurs setting up a greenfield enterprise.',
      assistance: '₹10L to ₹1 Crore | 75% Coverage',
      explanation: {
        summary: 'High loan ceiling for SC/ST or women entrepreneurs starting greenfield ventures.',
        matchedCriteria: [
          'Category matched: SC category applicant',
          'Activity matched: Manufacturing & service unit eligible',
        ],
        missingInformation: [
          'Greenfield status: Enterprise must be a first-time venture to qualify',
        ],
        disclaimer: 'Guidance based on available information. Final eligibility is subject to official verification.',
      },
    },
  ],
  loan: [
    {
      id: 'mudra',
      name: 'PM MUDRA Yojana',
      match: 92,
      eligibility: 'Eligible',
      why: 'Easiest access — no collateral, minimal documents. Kishore/Tarun tier fits your requirement.',
      assistance: 'Up to ₹10 Lakhs | Low Interest',
      explanation: {
        summary: 'Institutional micro-credit for non-corporate micro/small enterprises.',
        matchedCriteria: [
          'Purpose matched: Working capital and asset creation',
          'Simplified documentation pathway',
        ],
        disclaimer: 'Guidance based on available information. Final eligibility is subject to official verification.',
      },
    },
    {
      id: 'pmegp',
      name: 'PMEGP',
      match: 85,
      eligibility: 'Eligible',
      why: 'Suitable for new enterprise. 25–35% capital subsidy reduces effective loan burden.',
      assistance: 'Up to ₹25 Lakhs | 25-35% Subsidy',
      explanation: {
        summary: 'Credit-linked subsidy programme by Ministry of MSME.',
        matchedCriteria: [
          'Subsidy matched: Up to 35% margin money assistance',
          'Bank credit matched: 90-95% project cost',
        ],
        disclaimer: 'Guidance based on available information. Final eligibility is subject to official verification.',
      },
    },
  ],
};

/* ==========================================================================
   AI Assistant Service
   ========================================================================== */

class AIService {
  private useMock: boolean = true;

  /**
   * Toggle mock mode for development vs live backend
   */
  public setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }

  /**
   * POST /api/ai/chat
   * Send a user query with optional profile context and page context to the backend AI agent
   */
  public async sendChatMessage(request: AIChatRequest): Promise<AIChatResponse> {
    if (!this.useMock) {
      return apiFetch<AIChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    }

    // Isolated development mock simulation
    await new Promise(resolve => setTimeout(resolve, 800));

    const detectedLang = detectLanguage(request.message);
    const lower = request.message.toLowerCase();
    const isTailoring = lower.includes('tailoring') || lower.includes('silai') || lower.includes('தையல்') || lower.includes('thozhil');
    const isLoan = lower.includes('loan') || lower.includes('கடன்') || lower.includes('ரூபாய்') || lower.includes('lakh') || lower.includes('lacs');
    const isEligib = lower.includes('eligib') || lower.includes('யோகியம்') || lower.includes('patra');
    const isDoc = lower.includes('document') || lower.includes('papers') || lower.includes('ஆவணம்');
    const isEmi = lower.includes('emi') || lower.includes('calculat') || lower.includes('monthly');
    const isPartner = lower.includes('partner') || lower.includes('bank') || lower.includes('office') || lower.includes('nearby');

    let responseText = `I understand you're asking about government schemes and assistance. Based on your saved profile (${request.userProfile?.name || 'User'}, ${request.userProfile?.city || 'Tamil Nadu'}), could you tell me more about what specific assistance you need?`;
    let cards: AISchemeCard[] | undefined = undefined;
    let usedFields: string[] | undefined = request.relevantProfileFields;
    let missingFields: { field: string; label: string; actionText?: string }[] | undefined = undefined;

    if (isTailoring) {
      const profileSummary = request.userProfile
        ? ` (${request.userProfile.category || 'SC'} Category, ${request.userProfile.city || 'Coimbatore'} ${request.userProfile.locationType === 'urban' ? 'Urban' : 'Rural'}, Annual Income: ${request.userProfile.annualIncome || '₹2,40,000'})`
        : '';
      responseText = `Sure! உங்கள் saved profile${profileSummary} அடிப்படையில் tailoring business schemes-ஐ analyze செய்தேன்.\n\nஉங்கள் requirement மற்றும் profile-க்கு இந்த schemes மிகவும் suitable-ஆக இருக்கும்:`;
      cards = DEV_SCHEME_CARDS.tailoring;
      usedFields = request.relevantProfileFields || ['Category', 'Annual income', 'Occupation', 'Location'];
    } else if (isLoan) {
      const locStr = request.userProfile?.city ? ` in ${request.userProfile.city}` : '';
      responseText = `Based on your profile${locStr} (${request.userProfile?.category || 'General'} Category, Income: ${request.userProfile?.annualIncome || 'Under ₹3L'}), here are the top matching government loan programmes:`;
      cards = DEV_SCHEME_CARDS.loan;
      usedFields = request.relevantProfileFields || ['Category', 'Annual income', 'Location'];
    } else if (isEligib) {
      if (request.userProfile?.annualIncome && request.userProfile?.category) {
        responseText = `Based on the information in your saved profile (**${request.userProfile.name}**, Age ${request.userProfile.age || 28}, **${request.userProfile.category}** Category, Annual Income: **${request.userProfile.annualIncome}**, Location: **${request.userProfile.city || 'Coimbatore'}** Urban), you appear **likely eligible** for several central and state welfare programmes.\n\n• **PMEGP:** Likely Eligible (Micro enterprise / ${request.userProfile.category} subsidy tier)\n• **MUDRA:** Likely Eligible (Kishore tier)\n• **Stand-Up India:** ${request.userProfile.category === 'SC' || request.userProfile.category === 'ST' ? 'Likely Eligible (SC category matched)' : 'Needs Review'}\n\n*Note: Sahaya AI provides guidance only — final approval is granted by implementing agencies.*`;
        cards = DEV_SCHEME_CARDS.tailoring.slice(0, 2);
        usedFields = ['Category', 'Annual income', 'Occupation', 'Location'];
      } else {
        responseText = `To check your eligibility accurately, I need your annual household income.`;
        missingFields = [{ field: 'annualIncome', label: 'Annual Income', actionText: 'Enter Income' }];
      }
    } else if (isDoc) {
      responseText = `Here are the commonly required documents for most government business schemes:\n\n**Identity & Address**\n• Aadhaar Card\n• PAN Card\n• Voter ID / Passport (any one)\n\n**Income & Category**\n• Income Certificate (from Tahsildar)\n• Caste Certificate (SC/ST/OBC)\n• BPL Card (if applicable)\n\n**Business**\n• Project Report / Business Plan\n• Bank Account (6 months statements)\n• Experience Certificate (if any)\n\n**Photos**\n• 2 passport-size photographs\n\nWould you like a specific checklist for a particular scheme?`;
      usedFields = request.userProfile?.category ? ['Category', 'Available documents'] : undefined;
    } else if (isEmi) {
      responseText = `I can help you calculate your EMI. For a ₹3 Lakh loan:\n\n**At 8% interest for 36 months:**\n• Monthly EMI: **₹9,403**\n• Total Interest: **₹38,508**\n• Total Repayment: **₹3,38,508**\n\n**With PMEGP subsidy (25%):**\n• Effective loan: ₹2,25,000\n• Monthly EMI: **₹7,052**\n• Subsidy saves you: ₹75,000\n\nWould you like me to open the full Financial Calculator for detailed projections?`;
      usedFields = request.userProfile?.annualIncome ? ['Annual income', 'Loan requirement'] : undefined;
    } else if (isPartner) {
      const cityName = request.userProfile?.city || 'Coimbatore';
      responseText = `Based on your location (**${cityName}**), here are the nearest authorized partners for scheme applications:\n\n📍 **Canara Bank — Main Branch** (0.8 km)\nSchemes: PMEGP, MUDRA, Stand-Up India\nMon–Fri: 10 AM – 4 PM\n\n📍 **State Bank of India — City Centre** (1.2 km)\nSchemes: All major schemes\nMon–Fri: 10 AM – 4 PM\n\n📍 **District Industries Centre — ${cityName}** (2.1 km)\nSchemes: PMEGP, KVIC\nMon–Fri: 10 AM – 5:30 PM\n\nShould I show you the full Partner Locator map?`;
      usedFields = ['Location'];
    } else if (request.pageContext?.page === 'scheme-details' && request.pageContext.scheme) {
      responseText = `You're viewing **${request.pageContext.scheme.name}**. Based on your profile (${request.userProfile?.category || 'General'}, ${request.userProfile?.city || 'Coimbatore'}), I can help you check criteria eligibility, calculate financial assistance, or find nearby application partners.`;
      usedFields = request.userProfile ? ['Category', 'Location'] : undefined;
    }

    return {
      conversationId: request.conversationId || `conv-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      text: responseText,
      schemeCards: cards,
      progressSteps: DEV_PROGRESS_STEPS,
      detectedLanguage: detectedLang,
      usedProfileFields: usedFields,
      missingProfileFields: missingFields,
    };
  }

  /**
   * POST /api/voice/transcribe
   * Transcribe an audio input buffer to text via backend STT service
   */
  public async transcribeAudio(request: VoiceTranscribeRequest): Promise<VoiceTranscribeResponse> {
    if (!this.useMock) {
      const formData = new FormData();
      if (request.audioBlob) formData.append('audio', request.audioBlob);
      if (request.audioBase64) formData.append('audioBase64', request.audioBase64);
      if (request.languageHint) formData.append('languageHint', request.languageHint);

      return apiFetch<VoiceTranscribeResponse>('/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
    }

    // Isolated development mock simulation
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
   * POST /api/voice/synthesize
   * Synthesize text to spoken audio via backend TTS service
   */
  public async synthesizeSpeech(request: VoiceSynthesizeRequest): Promise<VoiceSynthesizeResponse> {
    if (!this.useMock) {
      return apiFetch<VoiceSynthesizeResponse>('/voice/synthesize', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    }

    // Isolated development mock simulation
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      audioUrl: '',
      durationSeconds: 4.5,
    };
  }
}

export const aiService = new AIService();
export default aiService;
