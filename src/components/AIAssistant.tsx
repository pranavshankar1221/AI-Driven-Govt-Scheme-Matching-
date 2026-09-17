import { useState, useRef, useEffect, useCallback } from 'react';
import type { Page, Scheme } from '../types';
import type { VoiceState, Message, AgentProgressStep } from '../types/ai';
import { detectLanguage } from '../services/languageDetector';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { aiService } from '../services/aiService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { SUPPORTED_VOICE_LANGUAGES, translateText, detectScriptLanguage } from '../services/translator';
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
  const { t, language, setLanguage, languages } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: `Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, verify eligibility, calculate financial assistance, identify required documents, locate authorized channel partners, and guide your application.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeMsgLangMenuId, setActiveMsgLangMenuId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel error
      }
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

  // Pre-load speech synthesis voices on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch {
          // Ignore
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  // Multilingual Web Speech API (speechSynthesis) with support for ALL Indic languages
  const playWebSpeech = useCallback((text: string, messageId: string, speechLang?: string) => {
    const code = speechLang || language;

    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/•/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      setVoiceState('idle');
      setPlayingMessageId(null);
      return;
    }

    const langTagMap: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
      bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
      ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-IN',
      as: 'as-IN', ks: 'ks-IN', mai: 'mai-IN',
    };

    const targetLang = langTagMap[code] || 'en-IN';

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        
        const voices = window.speechSynthesis.getVoices();
        const primaryCode = (code || targetLang.split('-')[0]).toLowerCase();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang;
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        if (voices && voices.length > 0) {
          const matchedVoice = voices.find(v => {
            const vLang = (v.lang || '').toLowerCase();
            const vName = (v.name || '').toLowerCase();
            return (
              vLang === targetLang.toLowerCase() ||
              vLang.startsWith(primaryCode) ||
              vName.includes(primaryCode) ||
              vName.includes(code.toLowerCase())
            );
          });

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        utterance.onstart = () => {
          setVoiceState('playing');
          setPlayingMessageId(messageId);
        };

        utterance.onend = () => {
          stopAudioPlayback();
        };

        utterance.onerror = (err) => {
          console.warn('Speech synthesis error:', err);
          stopAudioPlayback();
        };

        setVoiceState('playing');
        setPlayingMessageId(messageId);
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis exception:', err);
        stopAudioPlayback();
      }
    } else {
      stopAudioPlayback();
    }
  }, [language, stopAudioPlayback]);

  const playTTS = useCallback(async (text: string, messageId: string, customLang?: string) => {
    stopAudioPlayback();
    setPlayingMessageId(messageId);
    setVoiceState('processing');

    const speechLang = customLang || language;

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
        playWebSpeech(text, messageId, speechLang);
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
        playWebSpeech(text, messageId, speechLang);
      };

      await audio.play();
    } catch {
      playWebSpeech(text, messageId, speechLang);
    }
  }, [stopAudioPlayback, language, playWebSpeech]);

  // Translate message text and trigger TTS in that specific language
  const handleTranslateAndSpeakMsg = async (msgId: string, targetLangCode: string) => {
    setActiveMsgLangMenuId(null);
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    let translated = targetMsg.text;
    if (targetLangCode !== 'en') {
      translated = await translateText(targetMsg.text, targetLangCode);
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === msgId
          ? {
              ...m,
              selectedLang: targetLangCode,
              translatedText: translated,
            }
          : m
      )
    );

    // Speak translated response using voice matching targetLangCode
    playTTS(translated, msgId, targetLangCode);
  };

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

      let translatedText: string | undefined = undefined;
      if (language !== 'en') {
        translatedText = await translateText(response.text, language);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? {
                ...m,
                text: response.text,
                translatedText: translatedText && translatedText !== response.text ? translatedText : undefined,
                selectedLang: language !== 'en' ? language : undefined,
                schemeCards: response.schemeCards,
                usedProfileFields: response.usedProfileFields,
                missingProfileFields: response.missingProfileFields,
                progressSteps: completedSteps,
                processing: false,
              }
            : m
        )
      );

      if (isVoice && response.text) {
        playTTS(translatedText || response.text, thinkingMsgId, language);
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

    if (voiceState === 'listening') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
        setVoiceState('idle');
      } else {
        await handleStopRecording();
      }
      return;
    }

    if (voiceState === 'processing') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;

        const langTagMap: Record<string, string> = {
          en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
          bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
          ml: 'ml-IN', pa: 'pa-IN', ur: 'ur-IN'
        };
        recognition.lang = langTagMap[language] || 'en-IN';

        let capturedText = '';

        recognition.onstart = () => {
          setVoiceState('listening');
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          if (fullTranscript && fullTranscript.trim()) {
            capturedText = fullTranscript.trim();
            setInput(capturedText);
          }
        };

        recognition.onend = () => {
          setVoiceState('idle');
          recognitionRef.current = null;
          if (capturedText && capturedText.trim()) {
            sendMessage(capturedText.trim(), true);
          }
        };

        recognition.onerror = async (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          recognitionRef.current = null;
          
          if (event.error === 'no-speech') {
            setVoiceState('idle');
            return;
          }

          // Fallback to MediaRecorder for speech recognition errors
          try {
            setVoiceState('listening');
            await startRecording();
          } catch {
            setVoiceState('idle');
            const msg: Message = {
              id: Date.now().toString(),
              role: 'ai',
              text: 'Microphone access is disabled in browser settings. Please allow microphone access or type your request.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, msg]);
          }
        };

        recognition.start();
        return;
      } catch {
        // Fallback to MediaRecorder
      }
    }

    try {
      setVoiceState('listening');
      await startRecording();
    } catch (err: any) {
      setVoiceState('idle');
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: err?.message || 'Could not access microphone. Please check your browser permissions or type your message.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
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

  const welcomePrompts = [
    'Tell me about PMEGP Loan & Subsidy Scheme',
    'Eligibility criteria for Pradhan Mantri Awaas Yojana',
    'Application process of Kisan Credit Scheme',
    'Schemes for students & youth?',
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
              return <h3 key={lIdx} className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1">{line.slice(2)}</h3>;
            }
            if (line.startsWith('## ')) {
              return <h4 key={lIdx} className="text-sm font-semibold text-[#004b87] dark:text-sky-300 mt-2 mb-1">{line.slice(3)}</h4>;
            }
            if (line.startsWith('### ')) {
              return <h5 key={lIdx} className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 mb-0.5">{line.slice(4)}</h5>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <div key={lIdx} className="flex gap-2 text-xs text-slate-800 dark:text-slate-200 ml-1">
                  <span className="text-[#004b87] dark:text-sky-400 font-bold">•</span>
                  <span>{renderFormattedInline(line.slice(2))}</span>
                </div>
              );
            }
            const numMatch = line.match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
              return (
                <div key={lIdx} className="flex gap-2 text-xs text-slate-800 dark:text-slate-200 ml-1">
                  <span className="text-[#004b87] dark:text-sky-400 font-semibold">{numMatch[1]}.</span>
                  <span>{renderFormattedInline(numMatch[2])}</span>
                </div>
              );
            }
            return <p key={lIdx} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{renderFormattedInline(line)}</p>;
          })}
        </div>
      );
    });
  };

  const renderFormattedInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        const isSchemeTitle = /\b(Programme|Yojana|Scheme|PMEGP|MUDRA|PMMY|Stand-Up|PMAY|PMFBY|DAY-NRLM)\b/i.test(inner) || /^\d+\./.test(inner);
        if (isSchemeTitle) {
          return (
            <span key={i} className="inline-flex items-center gap-1 font-bold text-[#004b87] dark:text-sky-300 bg-blue-500/10 dark:bg-sky-400/15 px-2 py-0.5 rounded-lg border border-blue-500/20 dark:border-sky-400/30 my-0.5">
              <span>🏛️</span>
              <span>{inner}</span>
            </span>
          );
        }
        return <strong key={i} className="font-semibold text-[#004b87] dark:text-sky-300">{inner}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-500 dark:text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full transition-all duration-300 rounded-3xl flex flex-col overflow-hidden shadow-2xl border theme-border theme-modal bg-white dark:bg-slate-900 ${
          isFullScreen ? 'h-[98vh] max-h-none max-w-[98vw]' : 'max-w-2xl h-[88vh] max-h-[720px]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-xl tracking-tight text-[#004b87] dark:text-sky-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Sahaya AI
            </h2>
            <span className="bg-[#004b87]/10 dark:bg-sky-400/15 text-[#004b87] dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#004b87]/20 dark:border-sky-400/30">
              Chat
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand / Fullscreen Toggle Button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title={isFullScreen ? "Restore Window" : "Expand Fullscreen"}
              aria-label="Toggle Fullscreen"
            >
              {isFullScreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0l0 5m6 6l5 5m0 0l-5 0m5 0l0-5" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close Assistant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>



        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-white dark:bg-slate-900">
          {/* Welcome Banner Card when starting chat */}
          {messages.length <= 1 && (
            <div className="bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 mb-4 shadow-sm animate-fade-in">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Sahaya AI
              </h1>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                Sahaya AI is a National Platform that aims to offer one-stop search and discovery of Government schemes.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Hi! I am your assistant, here to help you find eligible government schemes and provide information on eligibility criteria, the application process, required documents, and more for various schemes.
              </p>

              {/* Vertical Prompt Buttons */}
              <div className="space-y-3">
                {welcomePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-center text-xs font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#004b87] dark:hover:border-sky-400 hover:bg-blue-50/50 dark:hover:bg-sky-950/30 px-5 py-3.5 rounded-2xl transition-all shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Conversation Items */}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 animate-fade-in`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-[#004b87] text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold shadow">
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

                <div className={`rounded-2xl px-4 py-3 shadow-xs text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#004b87] text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.processing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Evaluating scheme eligibility & requirements…</span>
                      </div>
                      {msg.progressSteps && (
                        <AIAgentProgress steps={msg.progressSteps} isComplete={false} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {msg.role === 'ai' && msg.usedProfileFields && msg.usedProfileFields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 mb-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px]">
                          <span className="font-semibold text-[#004b87] dark:text-sky-300">Verified Profile Data Used:</span>
                          <div className="flex flex-wrap gap-1 items-center">
                            {msg.usedProfileFields.map(f => (
                              <span key={f} className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {renderText(msg.translatedText || msg.text)}
                    </div>
                  )}
                </div>

                {/* AI Audio Speaker Button + Per-Message Language Dropdown */}
                {msg.role === 'ai' && !msg.processing && msg.text && (() => {
                  const effectiveMsgLang = msg.selectedLang || detectScriptLanguage(msg.translatedText || msg.text) || language;
                  return (
                    <div className="flex items-center gap-2 mt-1.5 ml-1">
                      {/* Listen / Speak Button */}
                      <button
                        onClick={() => {
                          if (playingMessageId === msg.id && (voiceState === 'playing' || voiceState === 'processing')) {
                            stopAudioPlayback();
                          } else {
                            playTTS(msg.translatedText || msg.text, msg.id, effectiveMsgLang);
                          }
                        }}
                        className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1 rounded-full ${
                          playingMessageId === msg.id && (voiceState === 'playing' || voiceState === 'processing')
                            ? 'text-[#004b87] dark:text-sky-300 bg-blue-500/15 border border-blue-500/30 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        {playingMessageId === msg.id && (voiceState === 'playing' || voiceState === 'processing') ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#004b87] dark:bg-sky-400 animate-ping" />
                            <span>Reading Aloud…</span>
                          </>
                        ) : (
                          <>
                            <span>🔊</span>
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* Per-Message Language Selector Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMsgLangMenuId(activeMsgLangMenuId === msg.id ? null : msg.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full transition-colors shadow-xs"
                          title="Translate text & change voice language"
                        >
                          <span>🌐</span>
                          <span>
                            {SUPPORTED_VOICE_LANGUAGES.find(l => l.code === effectiveMsgLang)?.native || 'English'}
                          </span>
                          <span className="text-[9px] text-slate-400">▼</span>
                        </button>

                        {activeMsgLangMenuId === msg.id && (
                          <div className="absolute left-0 bottom-8 z-30 w-44 bg-white dark:bg-slate-800 border theme-border rounded-2xl shadow-xl py-1.5 max-h-48 overflow-y-auto">
                            <p className="px-3.5 py-1 text-[9px] font-semibold theme-text-muted uppercase">Voice & Translation</p>
                            {SUPPORTED_VOICE_LANGUAGES.map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => handleTranslateAndSpeakMsg(msg.id, lang.code)}
                                className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                                  effectiveMsgLang === lang.code ? 'font-bold text-[#004b87] dark:text-sky-400 bg-blue-50/50' : 'theme-text-main'
                                }`}
                              >
                                <span>{lang.native}</span>
                                <span className="text-[10px] theme-text-muted">{lang.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold shadow">
                  RK
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Bottom Input Box Container */}
        <div className="p-4 sm:p-5 border-t theme-border bg-white dark:bg-slate-900">
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 focus-within:border-[#004b87] dark:focus-within:border-sky-400 transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type something..."
              className="flex-1 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none min-w-0 pr-2"
            />

            {/* Right Action Icons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Voice Mic Button */}
              <button
                onClick={handleVoiceMic}
                className={`p-2 rounded-full transition-all ${
                  voiceState === 'listening'
                    ? 'text-red-600 bg-red-500/20 animate-pulse'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
                title="Voice Input"
                aria-label="Voice input"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Language Switcher Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
                  title="Change Language"
                  aria-label="Change Language"
                >
                  <span className="text-xs font-bold">A/अ</span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 bottom-11 z-30 w-44 bg-white dark:bg-slate-800 border theme-border rounded-2xl shadow-xl py-1.5 max-h-48 overflow-y-auto">
                    <p className="px-3.5 py-1 text-[10px] font-semibold theme-text-muted uppercase tracking-wider">Select Language</p>
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={async () => {
                          const langCode = lang.code;
                          setLanguage(langCode);
                          setShowLangMenu(false);

                          for (const m of messages) {
                            if (m.role === 'ai' && m.text && !m.processing) {
                              let translated = m.text;
                              if (langCode !== 'en') {
                                translated = await translateText(m.text, langCode);
                              }
                              setMessages(prev =>
                                prev.map(item =>
                                  item.id === m.id
                                    ? {
                                        ...item,
                                        selectedLang: langCode,
                                        translatedText: langCode !== 'en' ? translated : undefined,
                                      }
                                    : item
                                )
                              );
                            }
                          }
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                          language === lang.code ? 'font-bold text-[#004b87] dark:text-sky-400 bg-blue-50/50' : 'theme-text-main'
                        }`}
                      >
                        <span>{lang.native}</span>
                        <span className="text-[10px] theme-text-muted">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button Arrow */}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 rounded-full text-[#004b87] dark:text-sky-400 hover:text-[#003366] dark:hover:text-sky-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center ml-0.5"
                title="Send Message"
                aria-label="Send message"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footnote Disclaimer */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2.5 font-normal">
            Sahaya AI assistant can make mistakes. Consider checking important information against official scheme guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
