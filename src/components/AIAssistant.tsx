import { useState, useRef, useEffect } from 'react';
import type { Page, Scheme } from '../types';
import type { VoiceState, Message, SchemeCard } from '../types/ai';
import { detectLanguage } from '../services/languageDetector';

interface Props {
  onClose: () => void;
  navigate: (page: Page, schemeId?: string) => void;
  currentPage: Page;
  selectedScheme?: Scheme;
}

const mockResponses: Record<string, { text: string; cards?: SchemeCard[] }> = {
  tailoring: {
    text: `Sure! உங்கள் tailoring business-க்கு பொருத்தமான government schemes-ஐ பார்க்கலாம்.\n\nஉங்கள் requirement-ஐ analyze செய்தேன். இந்த schemes மிகவும் suitable-ஆக இருக்கும்:`,
    cards: [
      { id: 'pmegp', name: 'PM Employment Generation Programme (PMEGP)', match: 94, eligibility: 'Eligible', why: 'Tailoring qualifies as a micro manufacturing enterprise. 35% subsidy available for rural applicants.', assistance: 'Up to ₹25 Lakhs | 35% Subsidy' },
      { id: 'mudra', name: 'Pradhan Mantri MUDRA Yojana', match: 88, eligibility: 'Eligible', why: 'Your business fits the Kishore category (₹50K–₹5L). No collateral needed.', assistance: 'Up to ₹5 Lakhs | No Collateral' },
      { id: 'standup', name: 'Stand-Up India Scheme', match: 72, eligibility: 'Likely Eligible', why: 'Applicable if you are from SC/ST category or a woman entrepreneur.', assistance: '₹10L to ₹1 Crore | 75% Coverage' },
    ],
  },
  loan: {
    text: `I can help you find suitable loan schemes. Based on your query, here are the top matching government loan programmes:`,
    cards: [
      { id: 'mudra', name: 'PM MUDRA Yojana', match: 92, eligibility: 'Eligible', why: 'Easiest access — no collateral, minimal documents. Kishore/Tarun tier fits ₹3L requirement.', assistance: 'Up to ₹10 Lakhs | Low Interest' },
      { id: 'pmegp', name: 'PMEGP', match: 85, eligibility: 'Eligible', why: 'Suitable for new enterprise. 25–35% capital subsidy reduces effective loan burden.', assistance: 'Up to ₹25 Lakhs | 25% Subsidy' },
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
    text: `Based on your location (Chennai), here are the nearest authorized partners for scheme applications:\n\n**Top 3 Nearby Partners:**\n\n📍 **Canara Bank — Anna Nagar** (0.8 km)\nSchemes: PMEGP, MUDRA, Stand-Up India\nMon–Fri: 10 AM – 4 PM\n\n📍 **SBI — T. Nagar Branch** (1.2 km)\nSchemes: All major schemes\nMon–Fri: 10 AM – 4 PM\n\n📍 **District Industries Centre** (2.1 km)\nSchemes: PMEGP, KVIC\nMon–Fri: 10 AM – 5:30 PM\n\nShould I show you the full Partner Locator map?`,
  },
};

const getAIResponse = (text: string, currentPage: string, scheme?: Scheme): { text: string; cards?: SchemeCard[] } => {
  const lower = text.toLowerCase();
  if (lower.includes('tailoring') || lower.includes('silai') || lower.includes('தையல்')) return mockResponses.tailoring;
  if (lower.includes('loan') || lower.includes('கடன்') || lower.includes('ரூபாய்') || lower.includes('lakh') || lower.includes('lacs')) return mockResponses.loan;
  if (lower.includes('eligib') || lower.includes('யோகியம்') || lower.includes('patra')) return mockResponses.eligibility;
  if (lower.includes('document') || lower.includes('papers') || lower.includes('ஆவணம்')) return mockResponses.document;
  if (lower.includes('emi') || lower.includes('calculat') || lower.includes('monthly')) return mockResponses.emi;
  if (lower.includes('partner') || lower.includes('bank') || lower.includes('office') || lower.includes('nearby')) return mockResponses.partner;
  if (currentPage === 'scheme-details' && scheme) {
    return { text: `You're viewing **${scheme.name}**. Here's what I can tell you:\n\n${scheme.description}\n\n**Key benefit:** ${scheme.benefits[0]}\n\nWould you like me to check your eligibility, calculate the financial assistance, or find nearby application partners?` };
  }
  return { text: `I understand you're asking about government schemes and assistance. Could you tell me more about:\n\n• What kind of business or purpose?\n• Your approximate income level?\n• Your location (state/city)?\n\nThis will help me find the most suitable schemes for you.` };
};

export default function AIAssistant({ onClose, navigate, currentPage, selectedScheme }: Props) {
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
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      lang: detected.displayName,
      detectedLang: detected,
      timestamp: new Date(),
      isVoice,
    };
    const thinkingMsg: Message = { id: Date.now() + 1 + '', role: 'ai', text: '', timestamp: new Date(), processing: true };
    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');

    const steps = ['Understanding your requirement…', 'Checking eligibility criteria…', 'Finding suitable schemes…', 'Calculating financial fit…'];
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step >= steps.length) clearInterval(stepInterval);
      setMessages(prev => prev.map(m => m.id === thinkingMsg.id ? { ...m, text: steps[Math.min(step, steps.length - 1)] } : m));
    }, 700);

    setTimeout(() => {
      clearInterval(stepInterval);
      const response = getAIResponse(text, currentPage, selectedScheme);
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, text: response.text, schemeCards: response.cards, processing: false }
          : m
      ));
      if (isVoice) setVoiceState('playing');
    }, 3000);
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
    { label: 'Find Nearby Partner', msg: 'Find authorized partners near me in Chennai' },
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
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-white mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('• ')) {
        return <p key={i} className="text-slate-300 text-sm ml-2">• {line.slice(2)}</p>;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} className={`text-slate-200 text-sm ${i > 0 ? 'mt-1' : ''}`}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p)}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end sm:items-end sm:justify-end p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex h-full sm:h-[92vh] w-full sm:w-[900px] max-w-full rounded-none sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b1629]">

        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-56' : 'w-0 sm:w-52'} overflow-hidden transition-all duration-200 bg-[#060e1d] border-r border-white/8 flex flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-white/8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center"><span className="text-white text-xs font-bold">S</span></div>
              <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI</span>
            </div>
            <p className="text-xs text-slate-500">Multilingual Assistant</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sidebarLinks.map(({ label, icon, action }) => (
              <button key={label} onClick={action} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs transition-colors text-left">
                <span className="text-blue-400 text-base leading-none">{icon}</span>
                <span>{label}</span>
              </button>
            ))}

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
                <span className="text-blue-400 text-xs font-semibold">RK</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">Ravi Kumar</p>
                <p className="text-slate-500 text-xs">Chennai, TN</p>
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
            {/* Quick actions (only if first message) */}
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
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  {msg.role === 'user' && msg.lang && (
                    <p className="text-xs text-slate-500 text-right mb-1 mr-1">
                      Language detected: <span className="text-blue-400">{msg.lang}</span>
                      {msg.isVoice && <span className="ml-1.5 text-emerald-400">🎤 Voice</span>}
                    </p>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#0f1f3d] border border-white/8 rounded-bl-sm'}`}>
                    {msg.processing ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 h-5 items-end">
                          {[...Array(8)].map((_, i) => <span key={i} className="wave-bar text-blue-400" style={{ height: '16px' }} />)}
                        </div>
                        <span className="text-xs text-slate-400">{msg.text || 'Thinking…'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">{renderText(msg.text)}</div>
                    )}
                  </div>

                  {/* Scheme recommendation cards */}
                  {msg.schemeCards && msg.schemeCards.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.schemeCards.map((card, i) => (
                        <div key={card.id} className="bg-[#132040] border border-white/10 rounded-xl p-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              {i === 0 && <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full mb-1 inline-block">Best Match</span>}
                              <p className="text-white text-sm font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{card.name}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-2xl font-bold text-emerald-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{card.match}%</span>
                              <p className="text-xs text-slate-500">match</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{card.why}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.eligibility === 'Eligible' ? 'bg-emerald-400/15 text-emerald-400' : card.eligibility === 'Likely Eligible' ? 'bg-blue-400/15 text-blue-400' : 'bg-amber-400/15 text-amber-400'}`}>
                              {card.eligibility}
                            </span>
                            <span className="text-xs text-amber-400 font-medium">{card.assistance}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => navigate('scheme-details', card.id)} className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg transition-colors font-medium">View Scheme</button>
                            <button onClick={() => navigate('eligibility', card.id)} className="flex-1 text-xs border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-1.5 rounded-lg transition-colors">Check Eligibility</button>
                          </div>
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
