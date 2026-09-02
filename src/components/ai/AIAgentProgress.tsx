import React from 'react';
import type { AgentProgressStep, AgentProgressStatus } from '../../types/ai';

interface Props {
  steps: AgentProgressStep[];
  isComplete?: boolean;
  className?: string;
}

export default function AIAgentProgress({ steps, isComplete = false, className = '' }: Props) {
  const getStatusIcon = (status: AgentProgressStatus) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-4 h-4 rounded-full bg-emerald-400/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
        );
      case 'failed':
        return (
          <div className="w-4 h-4 rounded-full bg-amber-400/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 text-[10px] font-bold">
            !
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-4 h-4 rounded-full border border-slate-600/70 flex-shrink-0" />
        );
    }
  };

  const getStatusTextColor = (status: AgentProgressStatus) => {
    switch (status) {
      case 'completed':
        return 'text-slate-300 font-normal';
      case 'in_progress':
        return 'text-blue-300 font-medium';
      case 'failed':
        return 'text-amber-300 font-medium';
      case 'pending':
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className={`bg-[#0a162b]/80 border border-white/8 rounded-xl p-3 my-2 space-y-2 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`} />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isComplete ? 'Analysis Completed' : 'AI Reasoning in Progress'}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {steps.filter(s => s.status === 'completed').length}/{steps.length}
        </span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2.5 transition-all duration-200">
            {getStatusIcon(step.status)}
            <span className={`text-xs ${getStatusTextColor(step.status)} truncate`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
