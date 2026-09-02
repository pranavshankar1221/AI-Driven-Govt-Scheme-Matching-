import { useState, useRef, useEffect, useCallback } from 'react';
import type { Page, Scheme } from '../types';
import type { VoiceState, Message, AgentProgressStep } from '../types/ai';
import { detectLanguage } from '../services/languageDetector';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { aiService } from '../services/aiService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import AIAgentProgress from './ai/AIAgentProgress';
import AISchemeCard from './ai/AISchemeCard';

interface Props {
  onClose: () => void;
  navigate: (page: Page, schemeId?: string) => void;
  currentPage: Page;
  selectedScheme?: Scheme;
}

export default function AIAssistant({ onClose, navigate, currentPage, selectedScheme }: Props) {
  const { profile, getRelevantContext } = useProfile();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: `Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, verify eligibility, calculate financial assistance, identify required documents, locate authorized channel partners, and guide your application.\n\nHow can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch {
        // Ignore audio pause error
      }
      currentAudioRef.current = null;
    }
    setPlayingMessageId(null);
    setVoiceState('idle');
  }, []);

  useEffect(() => {
    return () => {
      cancelRecording();
      stopAudioPlayback();
    };
  }, [cancelRecording, stopAudioPlayback]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentPage === 'scheme-details' && selectedScheme) {
      const ctx: Message = {
        id: 'ctx',
        role: 'ai',
        text: `I see you're viewing **${selectedScheme.name}**. Feel free to ask me anything about this scheme — eligibility criteria, documents required, financial assistance calculations, or application process!`,
        timestamp: new Date(),
      };
      setMessages(prev => {
        if (prev.some(m => m.id === 'ctx')) return prev;
        return [...prev, ctx];
      });
    }
  }, [currentPage, selectedScheme]);

  const playTTS = useCallback(async (text: string, messageId: string) => {
    stopAudioPlayback();
    setPlayingMessageId(messageId);
    setVoiceState('processing');

    try {
      const ttsResponse = await aiService.synthesizeSpeech({
        text,
        voiceGender: 'female',
      });

      let audioSrc = ttsResponse.audioUrl || '';
      if (!audioSrc && ttsResponse.audioBase64) {
        audioSrc = ttsResponse.audioBase64.startsWith('data:')
          ? ttsResponse.audioBase64
          : `data:audio/mp3;base64,${ttsResponse.audioBase64}`;
      }

      if (!audioSrc) {
        setVoiceState('idle');
        setPlayingMessageId(null);
        return;
      }

      const audio = new Audio(audioSrc);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setVoiceState('playing');
        setPlayingMessageId(messageId);
      };

      audio.onended = () => {
        stopAudioPlayback();
      };

      audio.onerror = () => {
        stopAudioPlayback();
      };

      await audio.play();
    } catch {
      stopAudioPlayback();
    }
  }, [stopAudioPlayback]);

  const sendMessage = async (text: string, isVoice = false) => {
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
      { id: '2', label: 'Checking your profile context', status: 'pending' },
      { id: '3', label: 'Evaluating scheme eligibility', status: 'pending' },
      { id: '4', label: 'Finding suitable welfare schemes', status: 'pending' },
      { id: '5', label: 'Checking financial fit & subsidies', status: 'pending' },
    ];

    const thinkingMsgId = (Date.now() + 1).toString();
    const thinkingMsg: Message = {
      id: thinkingMsgId,
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

    try {
      const response = await aiService.sendChatMessage({
        message: text,
        userProfile: profile,
        profileContext: contextResult.relevantContext,
        relevantProfileFields: contextResult.relevantFieldLabels,
        pageContext: currentPage === 'scheme-details' && selectedScheme ? { page: currentPage, scheme: selectedScheme } : undefined,
      });

      clearInterval(stepInterval);
      const completedSteps = initialSteps.map(s => ({ ...s, status: 'completed' as const }));

      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? {
                ...m,
                text: response.text,
                schemeCards: response.schemeCards,
                usedProfileFields: response.usedProfileFields,
                missingProfileFields: response.missingProfileFields,
                progressSteps: completedSteps,
                processing: false,
              }
            : m
        )
      );

      // If voice message input, automatically synthesize and play AI response speech
      if (isVoice && response.text) {
        playTTS(response.text, thinkingMsgId);
      }
    } catch {
      clearInterval(stepInterval);
      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? {
                ...m,
                text: 'Sorry, I encountered an issue connecting to the AI service. Please try again.',
                processing: false,
              }
            : m
        )
      );
    }
  };

  const handleSend = () => { if (input.trim()) sendMessage(input); };

  const handleStopRecording = async () => {
    setVoiceState('processing');
    try {
      const audioBlob = await stopRecording();
      if (!audioBlob || audioBlob.size === 0) {
        setVoiceState('idle');
        return;
      }

      const sttResult = await aiService.transcribeAudio({
        audioBlob,
      });

      if (!sttResult.transcription || !sttResult.transcription.trim()) {
        setVoiceState('idle');
        return;
      }

      setVoiceState('idle');
      await sendMessage(sttResult.transcription, true);
    } catch {
      setVoiceState('idle');
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Sorry, I could not process your voice audio. Please check your microphone or type your message.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setVoiceState('idle');
  };

  const handleVoiceMic = async () => {
    stopAudioPlayback();

    if (isRecording || voiceState === 'listening') {
      await handleStopRecording();
      return;
    }

    if (voiceState === 'processing') return;

    try {
      setVoiceState('listening');
      await startRecording();
    } catch {
      setVoiceState('idle');
    }
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
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, pIdx) => {
      const lines = p.split('\n');
      return (
        <div key={pIdx} className="mb-2 last:mb-0 space-y-1">
          {lines.map((line, lIdx) => {
            if (line.startsWith('# ')) {
              return <h3 key={lIdx} className="text-base font-bold text-white mt-2 mb-1">{line.slice(2)}</h3>;
            }
            if (line.startsWith('## ')) {
              return <h4 key={lIdx} className="text-sm font-semibold text-teal-300 mt-2 mb-1">{line.slice(3)}</h4>;
            }
            if (line.startsWith('### ')) {
              return <h5 key={lIdx} className="text-xs font-semibold text-slate-200 mt-1.5 mb-0.5">{line.slice(4)}</h5>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <div key={lIdx} className="flex gap-2 text-xs text-slate-200 ml-1">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{renderFormattedInline(line.slice(2))}</span>
                </div>
              );
            }
            const numMatch = line.match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
              return (
                <div key={lIdx} className="flex gap-2 text-xs text-slate-200 ml-1">
                  <span className="text-teal-400 font-semibold">{numMatch[1]}.</span>
                  <span>{renderFormattedInline(numMatch[2])}</span>
                </div>
              );
            }
            return <p key={lIdx} className="text-xs text-slate-200 leading-relaxed">{renderFormattedInline(line)}</p>;
          })}
        </div>
      );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl h-[92vh] max-h-[760px] rounded-lg flex overflow-hidden shadow-2xl border theme-border theme-modal"
      >
        {/* Sidebar */}
        <div className={`w-64 border-r theme-border flex flex-col justify-between transition-all duration-200 theme-card-subtle ${sidebarOpen ? 'block absolute inset-y-0 left-0 z-20 h-full shadow-2xl' : 'hidden sm:flex'}`}>
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#004b87] flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <div>
                  <span className="theme-text-main font-bold text-xs block leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI</span>
                  <span className="text-[10px] text-[#004b87] dark:text-sky-300 font-semibold">Citizen Helpdesk</span>
                </div>
              </div>
              <button className="sm:hidden theme-text-muted hover:theme-text-main p-1" onClick={() => setSidebarOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="pt-2">
              {sidebarLinks.map(({ label, icon, action }) => (
                <button
                  key={label}
                  onClick={() => {
                    action();
                    if (sidebarOpen) setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs theme-text-muted hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left font-medium"
                >
                  <span className="text-[#004b87] dark:text-sky-300">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t theme-border">
              <p className="text-[10px] theme-text-muted px-3 mb-2 uppercase tracking-wider font-semibold">Recent Consultations</p>
              {['PMEGP loan enquiry', 'Tailoring business scheme', 'MUDRA eligibility check'].map(c => (
                <button
                  key={c}
                  onClick={() => sendMessage(`Tell me more about ${c}`)}
                  className="w-full text-left px-3 py-1.5 rounded text-xs theme-text-muted hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate"
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t theme-border">
              <p className="text-[10px] theme-text-muted px-3 mb-2 uppercase tracking-wider font-semibold">Priority Schemes</p>
              {[['PMEGP Subsidy', 'pmegp'], ['MUDRA Kishore', 'mudra'], ['Stand-Up India', 'standup'], ['PMAY Housing', 'pmay']].map(([name, id]) => (
                <button
                  key={id}
                  onClick={() => navigate('scheme-details', id)}
                  className="w-full text-left px-3 py-1.5 rounded text-xs theme-text-muted hover:text-[#004b87] dark:hover:text-sky-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate font-medium"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* User profile preview */}
          <div className="p-3 border-t theme-border theme-card-subtle">
            <div className="flex items-center gap-2 p-2 rounded-md theme-card shadow-sm">
              <div className="w-7 h-7 rounded bg-[#004b87] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'RK'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="theme-text-main text-xs font-semibold truncate">{profile.name}</p>
                  <span className="text-[9px] text-[#004b87] dark:text-sky-300 bg-blue-500/10 px-1 py-0.2 rounded font-medium">Active</span>
                </div>
                <p className="theme-text-muted text-[10px] truncate">{profile.city || 'Coimbatore'} · {profile.category || 'OBC'} · {profile.occupation || 'Tailoring'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 theme-modal">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#002244] bg-[#003366] text-white">
            <div className="flex items-center gap-3">
              <button className="sm:hidden text-slate-200 hover:text-white p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </button>
              <div>
                <h2 className="text-white font-bold text-sm tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Sahaya Citizen AI Helpdesk
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-200 font-medium">National Public Scheme Guidance</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages([{ id: '0', role: 'ai', text: "Session reset. How can I assist you with government welfare schemes today?", timestamp: new Date() }])}
                className="text-xs text-slate-200 hover:text-white border border-white/20 px-2.5 py-1 rounded transition-colors hover:bg-white/10"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="text-slate-200 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close Helpdesk"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
            {messages.length === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 animate-fade-in">
                {quickActions.map(({ label, msg }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(msg)}
                    className="text-xs theme-text-main border theme-border hover:border-[#004b87] px-3 py-2 rounded-md transition-colors text-left theme-card-subtle shadow-sm font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 animate-fade-in`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded bg-[#004b87] flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold shadow-sm">
                    S
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  {msg.role === 'user' && msg.lang && (
                    <p className="text-[10px] theme-text-muted text-right mb-0.5 mr-1">
                      Detected: <span className="text-[#004b87] dark:text-sky-300 font-semibold">{msg.lang}</span>
                      {msg.isVoice && <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-medium">🎤 Voice</span>}
                    </p>
                  )}
                  <div className={`rounded-md px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#004b87] text-white'
                      : 'theme-card border theme-border'
                  }`}>
                    {msg.processing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin" />
                          <span className="text-xs font-semibold theme-text-main">Analyzing government scheme database…</span>
                        </div>
                        {msg.progressSteps && (
                          <AIAgentProgress steps={msg.progressSteps} isComplete={false} />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {msg.role === 'ai' && msg.usedProfileFields && msg.usedProfileFields.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 mb-2 rounded bg-blue-500/10 border border-blue-500/20 text-[11px]">
                            <span className="font-semibold text-[#004b87] dark:text-sky-300">Verified Profile Data Used:</span>
                            <div className="flex flex-wrap gap-1 items-center">
                              {msg.usedProfileFields.map(f => (
                                <span key={f} className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {renderText(msg.text)}

                        {msg.missingProfileFields && msg.missingProfileFields.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t theme-border">
                            {msg.missingProfileFields.map(m => (
                              <button
                                key={m.field}
                                onClick={() => sendMessage(`My ${m.label} is ₹2,40,000`)}
                                className="text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1"
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
                    <div className="mt-2.5 space-y-2.5">
                      {msg.schemeCards.map((card, i) => (
                        <div key={card.id}>
                          <AISchemeCard card={card} onNavigate={navigate} isBestMatch={i === 0} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI message speaker play action */}
                  {msg.role === 'ai' && !msg.processing && (
                    <div className="flex items-center gap-2 mt-1 ml-0.5">
                      <button
                        onClick={() => {
                          if (playingMessageId === msg.id && currentAudioRef.current) {
                            if (!currentAudioRef.current.paused) {
                              currentAudioRef.current.pause();
                              setVoiceState('paused');
                              setPlayingMessageId(null);
                            } else {
                              currentAudioRef.current.play();
                              setVoiceState('playing');
                              setPlayingMessageId(msg.id);
                            }
                          } else {
                            playTTS(msg.text, msg.id);
                          }
                        }}
                        className={`flex items-center gap-1 text-[11px] transition-colors px-2 py-0.5 rounded ${
                          playingMessageId === msg.id && (voiceState === 'playing' || voiceState === 'processing')
                            ? 'text-[#004b87] dark:text-sky-300 bg-blue-500/15 border border-blue-500/30 font-semibold'
                            : 'theme-text-muted hover:theme-text-main border border-transparent'
                        }`}
                      >
                        {playingMessageId === msg.id && (voiceState === 'playing' || voiceState === 'processing') ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#004b87] dark:bg-sky-400 animate-ping" />
                            <span>{voiceState === 'processing' ? 'Synthesizing…' : 'Playing Audio'}</span>
                          </>
                        ) : (
                          <>
                            <span>🔊</span>
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                    RK
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Voice recording overlay */}
          {voiceState !== 'idle' && (
            <div className="mx-4 mb-3 theme-card rounded-md p-3.5 flex flex-col items-center gap-2.5 shadow-lg border theme-border">
              {voiceState === 'listening' && (
                <>
                  <p className="text-red-600 dark:text-red-400 text-xs font-semibold animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Microphone is active. Speak your question now…</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleCancelRecording} className="text-xs gov-btn-secondary px-3 py-1">Cancel</button>
                    <button onClick={handleStopRecording} className="text-xs gov-btn-primary px-3.5 py-1">Done / Submit Voice</button>
                  </div>
                </>
              )}
              {voiceState === 'processing' && (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin" />
                  <p className="theme-text-muted text-xs">Processing speech input with voice model…</p>
                </>
              )}
              {voiceState === 'playing' && (
                <>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Playing audio narration…</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (currentAudioRef.current) {
                          if (!currentAudioRef.current.paused) {
                            currentAudioRef.current.pause();
                            setVoiceState('paused');
                          } else {
                            currentAudioRef.current.play();
                            setVoiceState('playing');
                          }
                        }
                      }}
                      className="text-xs gov-btn-secondary px-3 py-1"
                    >
                      {currentAudioRef.current && currentAudioRef.current.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={stopAudioPlayback} className="text-xs gov-btn-secondary px-3 py-1">Close</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Input Bar */}
          <div className="px-4 py-3 border-t theme-border theme-card">
            <div className="flex items-center gap-2 theme-input rounded-md px-3 py-2 border theme-border">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask in English, தமிழ், हिंदी or any Indian language…"
                className="flex-1 bg-transparent theme-text-main text-xs sm:text-sm placeholder:theme-text-muted outline-none min-w-0"
              />
              <button
                onClick={handleVoiceMic}
                className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                  voiceState === 'listening'
                    ? 'text-red-600 bg-red-500/20 animate-pulse'
                    : 'theme-text-muted hover:text-[#004b87] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Voice input"
                aria-label="Voice input"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-1.5 gov-btn-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
                title="Send message"
                aria-label="Send message"
              >
                Send
              </button>
            </div>
            <p className="text-[10px] theme-text-muted text-center mt-1">
              Official citizen guidance assistant. Data verified against national scheme guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
