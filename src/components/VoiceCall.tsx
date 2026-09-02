import { useState, useEffect, useRef } from 'react';
import type { CallState, VoiceTranscriptEntry as TranscriptEntry } from '../types/ai';

interface Props {
  onClose: () => void;
  onContinueInChat: () => void;
}

const demoTranscript: TranscriptEntry[] = [
  { role: 'user', text: 'I want to start a tailoring business.', time: '0:08' },
  { role: 'ai', text: 'Sure! I can help you find suitable government schemes for a tailoring business. Are you in a rural or urban area?', time: '0:12' },
  { role: 'user', text: "I'm in Coimbatore. It's urban.", time: '0:18' },
  { role: 'ai', text: 'Great. For an urban tailoring business in Coimbatore, the PMEGP scheme with 15% subsidy and MUDRA Kishore loan would be ideal. Would you like to know your eligibility?', time: '0:25' },
];

export default function VoiceCall({ onClose, onContinueInChat }: Props) {
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
    }, 2500);
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
    connecting: 'Connecting…',
    connected: 'Connected',
    listening: 'Sahaya AI is listening…',
    processing: 'Processing…',
    speaking: 'Sahaya AI is speaking…',
    interrupted: 'Interrupted',
    ended: 'Call ended',
  };

  const stateColor: Record<CallState, string> = {
    connecting: 'text-amber-400',
    connected: 'text-emerald-400',
    listening: 'text-blue-400',
    processing: 'text-purple-400',
    speaking: 'text-emerald-400',
    interrupted: 'text-amber-400',
    ended: 'text-slate-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 bg-[#0b1629] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-white/8">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Talk to</p>
          <h2 className="text-white text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sahaya AI</h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${callState === 'ended' || callState === 'connecting' ? 'bg-slate-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={`text-sm font-medium ${stateColor[callState]}`}>{stateLabel[callState]}</span>
          </div>
          {(callState !== 'connecting' && callState !== 'ended') && (
            <p className="text-slate-500 text-xs mt-1">{formatTime(duration)}</p>
          )}
        </div>

        {/* Avatar + waveform */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <div className="relative">
            {(callState === 'listening' || callState === 'speaking') && (
              <>
                <span className="absolute inset-0 rounded-full bg-blue-600/30 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-blue-600/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
              callState === 'speaking' ? 'bg-blue-600/20 border-blue-500' :
              callState === 'listening' ? 'bg-emerald-600/20 border-emerald-500' :
              callState === 'connecting' ? 'bg-slate-700/50 border-slate-600' :
              'bg-blue-600/10 border-blue-500/30'
            }`}>
              <span className="text-4xl animate-float">🤖</span>
            </div>
          </div>

          {/* Waveform */}
          {callState !== 'connecting' && callState !== 'ended' && (
            <div className="flex gap-1 h-8 items-center">
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  className={`wave-bar ${callState === 'listening' || callState === 'speaking' ? 'text-blue-400' : 'text-slate-600'}`}
                  style={{ height: `${callState === 'processing' ? 8 : 20}px`, animationPlayState: callState === 'processing' ? 'paused' : 'running' }}
                />
              ))}
            </div>
          )}

          {callState === 'connecting' && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-slate-400 text-sm">Establishing secure connection…</p>
            </div>
          )}
        </div>

        {/* Live transcript */}
        {transcript.length > 0 && (
          <div ref={transcriptRef} className="mx-4 mb-4 bg-[#060e1d] rounded-2xl p-3 max-h-36 overflow-y-auto space-y-2 border border-white/8">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Live Transcript</p>
            {transcript.map((entry, i) => (
              <div key={i} className={`flex gap-2 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${entry.role === 'user' ? 'order-first' : ''}`}>
                  <p className={`text-xs font-semibold mb-0.5 ${entry.role === 'user' ? 'text-right text-blue-400' : 'text-emerald-400'}`}>
                    {entry.role === 'user' ? 'YOU' : 'SAHAYA AI'} · {entry.time}
                  </p>
                  <p className={`text-xs px-3 py-1.5 rounded-xl ${entry.role === 'user' ? 'bg-blue-600/20 text-slate-200' : 'bg-[#132040] text-slate-300'}`}>
                    {entry.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {callState !== 'ended' ? (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setMuted(!muted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-600/20 border border-red-500/50 text-red-400' : 'bg-white/8 border border-white/15 text-slate-300 hover:text-white hover:bg-white/15'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {muted
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  }
                </svg>
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>

              <button
                onClick={() => setSpeakerOn(!speakerOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!speakerOn ? 'bg-red-600/20 border border-red-500/50 text-red-400' : 'bg-white/8 border border-white/15 text-slate-300 hover:text-white hover:bg-white/15'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={speakerOn ? "M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-600">Tap the red button to end call</p>
          </div>
        ) : (
          <div className="px-6 pb-6 text-center">
            <div className="bg-[#0f1f3d] border border-white/8 rounded-2xl p-4 mb-4">
              <p className="text-slate-300 text-sm font-medium mb-1">Your conversation has been saved.</p>
              <p className="text-slate-500 text-xs">Duration: {formatTime(duration)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onContinueInChat} className="text-sm bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium transition-colors">Continue in Chat</button>
              <button onClick={() => { onClose(); }} className="text-sm border border-white/15 hover:border-white/30 text-slate-300 hover:text-white py-2.5 rounded-xl transition-colors">View Recommendations</button>
            </div>
            <button onClick={onClose} className="w-full mt-2 text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors">Start New Session</button>
          </div>
        )}
      </div>
    </div>
  );
}
