import { useState, useEffect, useRef } from 'react';
import type { CallState, VoiceTranscriptEntry as TranscriptEntry } from '../types/ai';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onClose: () => void;
  onContinueInChat: () => void;
}

const demoTranscript: TranscriptEntry[] = [
  { role: 'user', text: 'I want to start a tailoring business in Coimbatore.', time: '0:08' },
  { role: 'ai', text: 'Welcome Ravi! For an urban tailoring enterprise in Coimbatore, the PMEGP scheme offers a 15% capital subsidy, and MUDRA Kishore provides working capital up to ₹5 Lakhs.', time: '0:14' },
  { role: 'user', text: 'What documents do I need to prepare for PMEGP?', time: '0:22' },
  { role: 'ai', text: 'You will need your Aadhaar, Class 8 educational certificate, Caste certificate for OBC subsidy tier, and a simple Project Report. Shall we proceed with your application checklist?', time: '0:30' },
];

export default function VoiceCall({ onClose, onContinueInChat }: Props) {
  const { t } = useLanguage();
  const [callState, setCallState] = useState<CallState>('connecting');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [transcriptIdx, setTranscriptIdx] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Connecting → Connected
    const connectTimer = setTimeout(() => {
      setCallState('connected');
      setTimeout(() => setCallState('listening'), 1000);
    }, 2000);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callState === 'connected' || callState === 'listening' || callState === 'processing' || callState === 'speaking') {
      intervalRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [callState]);

  // Demo: cycle through transcript states
  useEffect(() => {
    if (callState === 'listening' || callState === 'speaking') {
      const timer = setTimeout(() => {
        if (transcriptIdx < demoTranscript.length) {
          const entry = demoTranscript[transcriptIdx];
          setTranscript(prev => [...prev, entry]);
          setTranscriptIdx(i => i + 1);
          setCallState(entry.role === 'user' ? 'processing' : 'listening');
          if (entry.role === 'user') {
            setTimeout(() => setCallState('speaking'), 1500);
          }
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [callState, transcriptIdx]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const endCall = () => setCallState('ended');

  const stateLabel: Record<CallState, string> = {
    connecting: 'Connecting to citizen voice gateway…',
    connected: 'Connected to voice session',
    listening: 'Officer / AI is listening to your speech…',
    processing: 'Retrieving scheme guidelines…',
    speaking: 'Sahaya AI is speaking…',
    interrupted: 'Voice session paused',
    ended: 'Call session ended',
  };

  const stateColor: Record<CallState, string> = {
    connecting: 'text-amber-300',
    connected: 'text-sky-300',
    listening: 'text-emerald-400',
    processing: 'text-sky-300',
    speaking: 'text-emerald-400',
    interrupted: 'text-amber-300',
    ended: 'text-slate-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-sm theme-modal border theme-border rounded-lg overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-5 pt-5 pb-3.5 text-center border-b border-[#002244] bg-[#003366] text-white">
          <p className="text-[10px] text-sky-200 uppercase tracking-wider font-semibold mb-0.5">Government Citizen Voice Session</p>
          <h2 className="text-white text-lg font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI Voice Helpline</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${callState === 'ended' || callState === 'connecting' ? 'bg-slate-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={`text-xs font-medium ${stateColor[callState]}`}>{stateLabel[callState]}</span>
          </div>
          {(callState !== 'connecting' && callState !== 'ended') && (
            <p className="text-slate-300 text-xs mt-1 font-mono">{formatTime(duration)}</p>
          )}
        </div>

        {/* Center Indicator */}
        <div className="px-6 py-5 flex flex-col items-center gap-3.5 theme-modal">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md ${
            callState === 'speaking' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
            callState === 'listening' ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-sky-400' :
            callState === 'connecting' ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-500' :
            'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-600'
          }`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>

          {/* Transcript Box */}
          <div
            ref={transcriptRef}
            className="w-full h-36 overflow-y-auto theme-card-subtle rounded border theme-border p-3 space-y-2 text-xs"
          >
            {transcript.length === 0 ? (
              <p className="theme-text-muted text-center italic text-[11px] pt-10">
                {callState === 'connecting' ? 'Establishing session connection…' : 'Start speaking your requirement in English, Tamil, or Hindi…'}
              </p>
            ) : (
              transcript.map((entry, idx) => (
                <div key={idx} className={`space-y-0.5 ${entry.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className="text-[10px] theme-text-muted font-medium">{entry.role === 'user' ? 'You' : 'Sahaya AI'} ({entry.time})</span>
                  <p className={`p-2 rounded text-xs leading-relaxed inline-block max-w-[90%] text-left ${
                    entry.role === 'user'
                      ? 'bg-[#004b87] text-white'
                      : 'theme-card border theme-border theme-text-main'
                  }`}>
                    {entry.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 pt-2 theme-modal border-t theme-border flex flex-col gap-2.5">
          {callState !== 'ended' ? (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setMuted(!muted)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                  muted ? 'bg-red-500/20 border-red-500 text-red-500' : 'theme-card border theme-border theme-text-main hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={muted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {muted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>

              <button
                onClick={endCall}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                <span>End Call</span>
              </button>

              <button
                onClick={() => setSpeakerOn(!speakerOn)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                  !speakerOn ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'theme-card border theme-border theme-text-main hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={speakerOn ? 'Mute Speaker' : 'Enable Speaker'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onContinueInChat}
                className="w-full py-2 gov-btn-primary text-xs text-center"
              >
                Continue Consultation in Text Chat →
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 gov-btn-secondary text-xs text-center"
              >
                {t('close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
