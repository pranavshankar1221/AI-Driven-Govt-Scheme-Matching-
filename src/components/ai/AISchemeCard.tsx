import React from 'react';
import type { AISchemeCard } from '../../types/ai';
import type { Page } from '../../types';

interface Props {
  card: AISchemeCard;
  onNavigate: (page: Page, schemeId?: string) => void;
  isBestMatch?: boolean;
}

export default function AISchemeCardView({ card, onNavigate, isBestMatch = false }: Props) {
  const getEligibilityBadgeStyle = (eligibility: string) => {
    switch (eligibility) {
      case 'Eligible':
        return 'bg-emerald-400/15 text-emerald-400 border-emerald-500/30';
      case 'Likely Eligible':
        return 'bg-blue-400/15 text-blue-400 border-blue-500/30';
      case 'Needs Review':
      default:
        return 'bg-amber-400/15 text-amber-400 border-amber-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    return 'text-amber-400';
  };

  const explanation = card.explanation;
  const disclaimer = explanation?.disclaimer || 'Guidance based on available information. Final eligibility is subject to official verification.';

  return (
    <div className="bg-[#132040] border border-white/10 rounded-2xl p-4 transition-all duration-200 hover:border-blue-500/30 shadow-lg shadow-black/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {isBestMatch && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Best Match
              </span>
            )}
            <span className={`text-[11px] font-medium border px-2 py-0.5 rounded-full ${getEligibilityBadgeStyle(card.eligibility)}`}>
              {card.eligibility}
            </span>
          </div>
          <h4 className="text-white text-sm font-semibold leading-snug" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {card.name}
          </h4>
        </div>

        {/* Match Percentage */}
        <div className="flex-shrink-0 text-right bg-[#0b1629]/70 border border-white/8 rounded-xl px-2.5 py-1.5">
          <div className={`text-xl font-extrabold ${getScoreColor(card.match)} leading-none`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {card.match}%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">match</span>
        </div>
      </div>

      {/* Financial Benefit Badge */}
      {card.assistance && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-1.5 mb-3 flex items-center gap-2">
          <span className="text-amber-400 text-xs">💰</span>
          <span className="text-amber-300 text-xs font-semibold truncate">{card.assistance}</span>
        </div>
      )}

      {/* Why summary */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {card.why}
      </p>

      {/* Explainability Breakdown */}
      {explanation && explanation.matchedCriteria && explanation.matchedCriteria.length > 0 && (
        <div className="bg-[#0b1629]/80 border border-white/8 rounded-xl p-3 mb-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Why this matches:
          </p>
          <div className="space-y-1">
            {explanation.matchedCriteria.map((criterion, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{criterion}</span>
              </div>
            ))}

            {explanation.missingInformation && explanation.missingInformation.map((info, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-300">
                <span className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 font-bold text-center leading-none mt-0.5">!</span>
                <span>{info}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-binding Disclaimer */}
      <p className="text-[10px] text-slate-500 italic mb-3 leading-normal flex items-start gap-1.5">
        <svg className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{disclaimer}</span>
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/8">
        <button
          onClick={() => onNavigate('scheme-details', card.id)}
          className="flex-1 min-w-[90px] text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-xl transition-colors text-center shadow-sm"
        >
          View Scheme
        </button>
        <button
          onClick={() => onNavigate('eligibility', card.id)}
          className="flex-1 min-w-[100px] text-xs border border-white/15 hover:border-white/30 text-slate-200 hover:text-white font-medium py-2 rounded-xl transition-colors text-center hover:bg-white/5"
        >
          Check Eligibility
        </button>
        <button
          onClick={() => onNavigate('calculator', card.id)}
          className="text-xs border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 py-2 px-3 rounded-xl transition-colors text-center hover:bg-white/5"
        >
          Calculate
        </button>
      </div>
    </div>
  );
}
