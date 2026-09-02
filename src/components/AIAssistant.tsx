import { useState, useRef, useEffect } from 'react';
import type { Page, Scheme } from '../types';
import type { VoiceState, Message, SchemeCard, UserProfile, AgentProgressStep } from '../types/ai';
import { detectLanguage } from '../services/languageDetector';
import { useProfile, type RelevantProfileResult } from '../context/ProfileContext';
import AIAgentProgress from './ai/AIAgentProgress';
import AISchemeCard from './ai/AISchemeCard';

interface Props {
  onClose: () => void;
  navigate: (page: Page, schemeId?: string) => void;
  currentPage: Page;
  selectedScheme?: Scheme;
}

const mockResponses: Record<string, { text: string; cards?: SchemeCard[] }> = {
  tailoring: {
    text: `Sure! உங்கள் tailoring business-க்கு பொருத்தமான government schemes-ஐ பார்க்கலாம்.\n\nஉங்கள் requirement மற்றும் saved profile-ஐ analyze செய்தேன். இந்த schemes மிகவும் suitable-ஆக இருக்கும்:`,
    cards: [
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
  },
  loan: {
    text: `I can help you find suitable loan schemes. Based on your query, here are the top matching government loan programmes:`,
    cards: [
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
  },
  eligibility: {
    text: `To check your eligibility accurately, I need a few details:\n\n1. **Age** — How old are you?\n2. **Category** — SC / ST / OBC / General?\n3. **Location** — Rural or Urban?\n4. **Business type** — What kind of business do you want to start?\n5. **Annual income** — Approximate household income?\n\nYou can share these details and I'll give you a personalized eligibility report.`,
  },
  document: {
    text: `Here are the commonly required documents for most government business schemes:\n\n**Identity & Address**\n• Aadhaar Card\n• PAN Card\n• Voter ID / Passport (any one)\n\n**Income & Category**\n• Income Certificate (from Tahsildar)\n• Caste Certificate (SC/ST/OBC)\n• BPL Card (if applicable)\n\n**Business**\n• Project Report / Business Plan\n• Bank Account (6 months statements)\n• Experience Certificate (if any)\n\n**Photos**\n• 2 passport-size photographs\n\nWould you like a specific checklist for a particular scheme?`,
  },
  emi: {
    text: `I can help you calculate your EMI. For a ₹3 Lakh loan:\n\n**At 8% interest for 36 months:**\n• Monthly EMI: **₹9,403**\n• Total Interest: **₹38,508**\n• Total Repayment: **₹3,38,508**\n\n**With PMEGP subsidy (25%):**\n• Effective loan: ₹2,25,000\n• Monthly EMI: **₹7,052**\n• Subsidy saves you: ₹75,000\n\nWould you like me to open the full Financial Calculator for detailed projections?`,
  },
  partner: {
    text: `Based on your location (Coimbatore), here are the nearest authorized partners for scheme applications:\n\n**Top 3 Nearby Partners:**\n\n📍 **Canara Bank — Main Branch** (0.8 km)\nSchemes: PMEGP, MUDRA, Stand-Up India\nMon–Fri: 10 AM – 4 PM\n\n📍 **State Bank of India — City Centre** (1.2 km)\nSchemes: All major schemes\nMon–Fri: 10 AM – 4 PM\n\n📍 **District Industries Centre — Coimbatore** (2.1 km)\nSchemes: PMEGP, KVIC\nMon–Fri: 10 AM – 5:30 PM\n\nShould I show you the full Partner Locator map?`,
  },
};

const getAIResponse = (
  text: string,
  currentPage: string,
  scheme?: Scheme,
  profile?: UserProfile,
  profileContextResult?: RelevantProfileResult
): {
  text: string;
  cards?: SchemeCard[];
  usedProfileFields?: string[];
  missingProfileFields?: { field: string; label: string; actionText?: string }[];
} => {
  const lower = text.toLowerCase();
  const isTailoring = lower.includes('tailoring') || lower.includes('silai') || lower.includes('தையல்') || lower.includes('thozhil');
  const isLoan = lower.includes('loan') || lower.includes('கடன்') || lower.includes('ரூபாய்') || lower.includes('lakh') || lower.includes('lacs');
  const isEligib = lower.includes('eligib') || lower.includes('யோகியம்') || lower.includes('patra');
  const isDoc = lower.includes('document') || lower.includes('papers') || lower.includes('ஆவணம்');
  const isEmi = lower.includes('emi') || lower.includes('calculat') || lower.includes('monthly');
  const isPartner = lower.includes('partner') || lower.includes('bank') || lower.includes('office') || lower.includes('nearby');

  if (isTailoring) {
    const profileSummary = profile ? ` (${profile.category} Category, ${profile.city} ${profile.locationType === 'urban' ? 'Urban' : 'Rural'}, Annual Income: ${profile.annualIncome})` : '';
    return {
      text: `Sure! உங்கள் saved profile${profileSummary} அடிப்படையில் tailoring business schemes-ஐ analyze செய்தேன்.\n\nஉங்கள் requirement மற்றும் profile-க்கு இந்த schemes மிகவும் suitable-ஆக இருக்கும்:`,
      cards: mockResponses.tailoring.cards,
      usedProfileFields: profileContextResult?.relevantFieldLabels.length ? profileContextResult.relevantFieldLabels : ['Category', 'Annual income', 'Occupation', 'Location'],
    };
  }

  if (isLoan) {
    const locStr = profile?.city ? ` in ${profile.city}` : '';
    return {
      text: `Based on your profile${locStr} (${profile?.category || 'General'} Category, Income: ${profile?.annualIncome || 'Under ₹3L'}), here are the top matching government loan programmes:`,
      cards: mockResponses.loan.cards,
      usedProfileFields: profileContextResult?.relevantFieldLabels.length ? profileContextResult.relevantFieldLabels : ['Category', 'Annual income', 'Location'],
    };
  }

  if (isEligib) {
    if (profile && profile.annualIncome && profile.category) {
      return {
        text: `Based on the information in your saved profile (**${profile.name}**, Age ${profile.age}, **${profile.category}** Category, Annual Income: **${profile.annualIncome}**, Location: **${profile.city}** Urban), you appear **likely eligible** for several central and state welfare programmes.\n\n• **PMEGP:** Likely Eligible (Micro enterprise / ${profile.category} subsidy tier)\n• **MUDRA:** Likely Eligible (Kishore tier)\n• **Stand-Up India:** ${profile.category === 'SC' || profile.category === 'ST' ? 'Likely Eligible (SC category matched)' : 'Needs Review'}\n\n*Note: Sahaya AI provides guidance only — final approval is granted by implementing agencies.*`,
        cards: mockResponses.tailoring.cards?.slice(0, 2),
        usedProfileFields: ['Category', 'Annual income', 'Occupation', 'Location'],
      };
    }
    return {
      text: `To check your eligibility accurately, I need your annual household income.`,
      missingProfileFields: profileContextResult?.missingFields.length ? profileContextResult.missingFields : [{ field: 'annualIncome', label: 'Annual Income', actionText: 'Enter Income' }],
    };
  }

  if (isDoc) {
    return {
      text: mockResponses.document.text,
      usedProfileFields: profile?.category ? ['Category', 'Available documents'] : undefined,
    };
  }

  if (isEmi) {
    return {
      text: mockResponses.emi.text,
      usedProfileFields: profile?.annualIncome ? ['Annual income', 'Loan requirement'] : undefined,
    };
  }

  if (isPartner) {
    const cityName = profile?.city || 'Coimbatore';
    return {
      text: `Based on your location (**${cityName}**), here are the nearest authorized partners for scheme applications:\n\n📍 **Canara Bank — Main Branch** (0.8 km)\nSchemes: PMEGP, MUDRA, Stand-Up India\nMon–Fri: 10 AM – 4 PM\n\n📍 **State Bank of India — City Centre** (1.2 km)\nSchemes: All major schemes\nMon–Fri: 10 AM – 4 PM\n\n📍 **District Industries Centre — ${cityName}** (2.1 km)\nSchemes: PMEGP, KVIC\nMon–Fri: 10 AM – 5:30 PM\n\nShould I show you the full Partner Locator map?`,
      usedProfileFields: ['Location'],
    };
  }

  if (currentPage === 'scheme-details' && scheme) {
    return {
      text: `You're viewing **${scheme.name}**. Based on your profile (${profile?.category || 'General'}, ${profile?.city || 'Coimbatore'}), I can help you check criteria eligibility, calculate financial assistance, or find nearby application partners.`,
      usedProfileFields: profile ? ['Category', 'Location'] : undefined,
    };
  }

  return {
    text: `I understand you're asking about government schemes and assistance. Based on your saved profile (${profile?.name || 'Ravi Kumar'}, ${profile?.city || 'Tamil Nadu'}), could you tell me more about:\n\n• What kind of business or purpose?\n• Your approximate assistance amount needed?\n\nThis will help me find the most suitable schemes for you.`,
    usedProfileFields: profile ? ['Location'] : undefined,
  };
};

export default function AIAssistant({ onClose, navigate, currentPage, selectedScheme }: Props) {
  const { profile, getRelevantContext } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: `Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, check eligibility, calculate financial assistance, find required documents, locate authorized channel partners and guide you through the application process.\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentPage === 'scheme-details' && selectedScheme) {
      const ctx: Message = {
        id: 'ctx',
        role: 'ai',
        text: `I see you're viewing **${selectedScheme.name}**. Feel free to ask me anything about this scheme — eligibility, documents, financial assistance, or how to apply!`,
        timestamp: new Date(),
      };
      setMessages(prev => {
        if (prev.some(m => m.id === 'ctx')) return prev;
        return [...prev, ctx];
      });
    }
  }, [currentPage, selectedScheme]);

  const sendMessage = (text: string, isVoice = false) => {
    if (!text.trim()) return;
    const detected = detectLanguage(text);
    const contextResult = getRelevantContext(text);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      lang: detected.displayName,
      detectedLang: detected,
      timestamp: new Date(),
      isVoice,
    };

    const initialSteps: AgentProgressStep[] = [
      { id: '1', label: 'Understanding your requirement', status: 'in_progress' },
      { id: '2', label: 'Checking your profile', status: 'pending' },
      { id: '3', label: 'Checking eligibility criteria', status: 'pending' },
      { id: '4', label: 'Finding suitable schemes', status: 'pending' },
      { id: '5', label: 'Checking financial fit', status: 'pending' },
    ];

    const thinkingMsg: Message = {
      id: Date.now() + 1 + '',
      role: 'ai',
      text: '',
      timestamp: new Date(),
      processing: true,
      progressSteps: initialSteps,
    };
    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== thinkingMsg.id) return m;
          const updated = (m.progressSteps || initialSteps).map((step, idx) => {
            if (idx < currentStep) return { ...step, status: 'completed' as const };
            if (idx === currentStep) return { ...step, status: 'in_progress' as const };
            return { ...step, status: 'pending' as const };
          });
          return { ...m, progressSteps: updated };
        })
      );
      if (currentStep >= 4) {
        clearInterval(stepInterval);
      }
    }, 450);

    setTimeout(() => {
      clearInterval(stepInterval);
      const response = getAIResponse(text, currentPage, selectedScheme, profile, contextResult);
      const completedSteps = initialSteps.map(s => ({ ...s, status: 'completed' as const }));

      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? {
                ...m,
                text: response.text,
                schemeCards: response.cards,
                usedProfileFields: response.usedProfileFields,
                missingProfileFields: response.missingProfileFields,
                progressSteps: completedSteps,
                processing: false,
              }
            : m
        )
      );
      if (isVoice) setVoiceState('playing');
    }, 2400);
  };

  const handleSend = () => { if (input.trim()) sendMessage(input); };

  const handleVoiceMic = () => {
    if (voiceState !== 'idle') { setVoiceState('idle'); if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current); return; }
    setVoiceState('listening');
    voiceTimerRef.current = setTimeout(() => {
      setVoiceState('processing');
      setTimeout(() => {
        setVoiceState('idle');
        sendMessage('Enakku tailoring business start panna loan venum. Coimbatore-la irukken.', true);
      }, 1500);
    }, 3000);
  };

  const quickActions = [
    { label: 'Find a Scheme', msg: 'I want to find a suitable government scheme for my business' },
    { label: 'Check Eligibility', msg: 'Can you check my eligibility for government schemes?' },
    { label: 'Calculate EMI', msg: 'Help me calculate EMI for a 3 lakh loan' },
    { label: 'Required Documents', msg: 'What documents do I need for scheme applications?' },
    { label: 'Find Nearby Partner', msg: 'Find authorized partners near me in Coimbatore' },
    { label: 'Explain Recommendation', msg: 'Can you explain which scheme suits me best?' },
  ];

  const sidebarLinks = [
    { label: 'New Chat', icon: '✦', action: () => setMessages([{ id: '0', role: 'ai', text: "Hello! I'm your Sahaya AI Assistant. How can I help you today?", timestamp: new Date() }]) },
    { label: 'Popular Schemes', icon: '◈', action: () => navigate('catalog') },
    { label: 'Calculate EMI', icon: '◇', action: () => navigate('calculator') },
    { label: 'Required Documents', icon: '◉', action: () => navigate('documents') },
    { label: 'Find Nearby Partner', icon: '◎', action: () => navigate('partners') },
  ];

  const renderText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (!line) return <div key={i} className="h-1.5" />;
      let formatted: React.ReactNode = line;
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const content = line.slice(2);
        return (
          <div key={i} className="flex items-start gap-1.5 ml-1 text-xs">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>{renderFormattedInline(content)}</span>
          </div>
        );
      }
      return <p key={i} className="text-xs leading-relaxed">{renderFormattedInline(line)}</p>;
    });
  };

  const renderFormattedInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl h-[92vh] max-h-[780px] rounded-2xl flex overflow-hidden shadow-2xl border border-white/10"
        style={{ background: '#0b1629' }}
      >
        {/* Sidebar */}
        <div className={`w-64 border-r border-white/8 flex flex-col justify-between transition-all duration-300 bg-[#081120] ${sidebarOpen ? 'block absolute inset-y-0 left-0 z-10' : 'hidden sm:flex'}`}>
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="text-white font-bold text-xs" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI</span>
              </div>
              <button className="sm:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="pt-2">
              {sidebarLinks.map(({ label, icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left group"
                >
                  <span className="text-slate-500 group-hover:text-blue-400 text-sm transition-colors">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-white/8">
              <p className="text-xs text-slate-600 px-3 mb-2 uppercase tracking-wider">Recent Chats</p>
              {['PMEGP loan enquiry', 'Tailoring business scheme', 'MUDRA eligibility check'].map(c => (
                <button key={c} className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors truncate">{c}</button>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-white/8">
              <p className="text-xs text-slate-600 px-3 mb-2 uppercase tracking-wider">Major Schemes</p>
              {[['PMEGP', 'pmegp'], ['MUDRA', 'mudra'], ['Stand-Up India', 'standup'], ['PMAY', 'pmay']].map(([name, id]) => (
                <button key={id} onClick={() => navigate('scheme-details', id)} className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors truncate">{name}</button>
              ))}
            </div>
          </div>

          {/* User profile */}
          <div className="p-3 border-t border-white/8">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-semibold">
                  {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'RK'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-xs font-medium truncate">{profile.name}</p>
                  <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1 py-0.2 rounded font-semibold">Demo Profile</span>
                </div>
                <p className="text-slate-500 text-xs truncate">{profile.city}, {profile.category} · {profile.occupation || 'Tailor'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0f1f3d]/50">
            <div className="flex items-center gap-3">
              <button className="sm:hidden text-slate-400 hover:text-white p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </button>
              <div>
                <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI Assistant</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-400">AI Assistant Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages([{ id: '0', role: 'ai', text: "Session reset. How can I help you?", timestamp: new Date() }])}
                className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg transition-colors"
              >Reset</button>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {quickActions.map(({ label, msg }) => (
                  <button key={label} onClick={() => sendMessage(msg)} className="text-xs text-slate-300 border border-white/10 hover:border-blue-500/50 hover:text-white hover:bg-blue-600/10 px-3 py-2 rounded-xl transition-all text-left">
                    {label}
                  </button>
                ))}
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  {msg.role === 'user' && msg.lang && (
                    <p className="text-xs text-slate-500 text-right mb-1 mr-1">
                      Language detected: <span className="text-blue-400">{msg.lang}</span>
                      {msg.isVoice && <span className="ml-1.5 text-emerald-400">🎤 Voice</span>}
                    </p>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#0f1f3d] border border-white/8 rounded-bl-sm'}`}>
                    {msg.processing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 h-4 items-end">
                            {[...Array(6)].map((_, i) => <span key={i} className="wave-bar text-blue-400" style={{ height: '14px' }} />)}
                          </div>
                          <span className="text-xs text-blue-300 font-medium">Sahaya AI is analyzing...</span>
                        </div>
                        {msg.progressSteps && (
                          <AIAgentProgress steps={msg.progressSteps} isComplete={false} />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {msg.role === 'ai' && msg.usedProfileFields && msg.usedProfileFields.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 mb-2.5 rounded-xl bg-blue-900/40 border border-blue-500/25 text-xs">
                            <span className="font-semibold text-blue-200">Using your saved profile</span>
                            <span className="text-slate-500">·</span>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {msg.usedProfileFields.map(f => (
                                <span key={f} className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {renderText(msg.text)}

                        {msg.missingProfileFields && msg.missingProfileFields.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-white/8">
                            {msg.missingProfileFields.map(m => (
                              <button
                                key={m.field}
                                onClick={() => sendMessage(`My ${m.label} is ₹2,40,000`)}
                                className="text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                              >
                                <span>+</span> {m.actionText || `Provide ${m.label}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scheme recommendation cards */}
                  {msg.schemeCards && msg.schemeCards.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {msg.schemeCards.map((card, i) => (
                        <div key={card.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                          <AISchemeCard card={card} onNavigate={navigate} isBestMatch={i === 0} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI message actions */}
                  {msg.role === 'ai' && !msg.processing && (
                    <div className="flex items-center gap-2 mt-1.5 ml-1">
                      <button
                        onClick={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, playingVoice: !m.playingVoice } : m));
                          setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, playingVoice: false } : m)), 4000);
                        }}
                        className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-lg ${msg.playingVoice ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                      >
                        {msg.playingVoice ? (
                          <>
                            <div className="flex gap-0.5 h-3 items-end">
                              {[...Array(4)].map((_, i) => <span key={i} className="wave-bar text-blue-400" style={{ height: '10px' }} />)}
                            </div>
                            <span>Playing…</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" /></svg>
                            <span>Play</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-semibold">RK</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Voice recording overlay */}
          {voiceState !== 'idle' && (
            <div className="mx-4 mb-3 bg-[#0f1f3d] border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center gap-3">
              {voiceState === 'listening' && (
                <>
                  <div className="flex gap-1 h-8 items-end">
                    {[...Array(12)].map((_, i) => <span key={i} className="wave-bar text-blue-400" style={{ height: '24px' }} />)}
                  </div>
                  <p className="text-blue-400 text-sm font-medium animate-pulse">Listening…</p>
                  <div className="flex gap-2">
                    <button onClick={() => setVoiceState('idle')} className="text-xs text-slate-400 hover:text-white border border-white/15 px-3 py-1.5 rounded-lg">Cancel</button>
                    <button onClick={() => { setVoiceState('processing'); setTimeout(() => { setVoiceState('idle'); sendMessage('Enakku tailoring business start panna loan venum.', true); }, 1500); }} className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg">Stop</button>
                  </div>
                </>
              )}
              {voiceState === 'processing' && (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <p className="text-slate-300 text-sm">Processing your voice…</p>
                </>
              )}
              {voiceState === 'playing' && (
                <>
                  <div className="flex gap-1 h-8 items-end">
                    {[...Array(10)].map((_, i) => <span key={i} className="wave-bar text-emerald-400" style={{ height: '24px' }} />)}
                  </div>
                  <p className="text-emerald-400 text-sm font-medium">Playing response…</p>
                  <div className="flex gap-2">
                    <button onClick={() => setVoiceState('paused')} className="text-xs text-white border border-white/15 px-3 py-1.5 rounded-lg">Pause</button>
                    <button onClick={() => setVoiceState('idle')} className="text-xs text-slate-400 hover:text-white border border-white/15 px-3 py-1.5 rounded-lg">Close</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-white/8">
            <div className="flex items-center gap-2 bg-[#132040] border border-white/10 rounded-2xl px-3 py-2">
              <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask in English, தமிழ், हिंदी or any language…"
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none min-w-0"
              />
              <button
                onClick={handleVoiceMic}
                className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${voiceState === 'listening' ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <p className="text-xs text-slate-600 text-center mt-1.5">Sahaya AI provides guidance only — not official legal or financial advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
