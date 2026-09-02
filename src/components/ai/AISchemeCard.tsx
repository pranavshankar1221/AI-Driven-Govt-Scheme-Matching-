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
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'Likely Eligible':
        return 'bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/30';
      case 'Needs Review':
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 dark:text-emerald-400';
    if (score >= 80) return 'text-[#004b87] dark:text-sky-300';
    return 'text-amber-700 dark:text-amber-400';
  };

  const explanation = card.explanation;
  const disclaimer = explanation?.disclaimer || 'Guidance based on verified profile parameters. Formal sanctions are approved by designated nodal banks.';

  return (
    <div className="theme-card hover:border-[#004b87] rounded-md p-4 transition-all duration-150 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isBestMatch && (
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded uppercase tracking-wider">
                ★ Top Match
              </span>
            )}
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${getEligibilityBadgeStyle(card.eligibility)}`}>
              {card.eligibility}
            </span>
          </div>
          <h4 className="theme-text-main text-sm font-bold leading-snug" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {card.name}
          </h4>
        </div>

        {/* Match Percentage */}
        <div className="flex-shrink-0 text-center theme-card-subtle border theme-border rounded px-2.5 py-1">
          <div className={`text-lg font-extrabold ${getScoreColor(card.match)} leading-none`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {card.match}%
          </div>
          <span className="text-[9px] theme-text-muted font-semibold uppercase">match</span>
        </div>
      </div>

      {/* Financial Benefit Badge */}
      {card.assistance && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 rounded px-2.5 py-1 mb-2.5 flex items-center gap-1.5">
          <span className="text-amber-700 dark:text-amber-300 text-xs">💰</span>
          <span className="text-amber-900 dark:text-amber-200 text-xs font-semibold truncate">{card.assistance}</span>
        </div>
      )}

      {/* Why summary */}
      <p className="text-xs theme-text-muted leading-relaxed mb-2.5">
        {card.why}
      </p>

      {/* Explainability Breakdown */}
      {explanation && explanation.matchedCriteria && explanation.matchedCriteria.length > 0 && (
        <div className="theme-card-subtle rounded p-2.5 mb-2.5 space-y-1 border theme-border">
          <p className="text-[10px] font-bold theme-text-main uppercase tracking-wider">
            Verified Eligibility Criteria:
          </p>
          <div className="space-y-0.5">
            {explanation.matchedCriteria.map((criterion, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] theme-text-main">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">✓</span>
                <span>{criterion}</span>
              </div>
            ))}

            {explanation.missingInformation && explanation.missingInformation.map((info, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                <span className="font-bold leading-none mt-0.5">!</span>
                <span>{info}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] theme-text-muted italic mb-3 leading-tight">
        {disclaimer}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t theme-border">
        <button
          onClick={() => onNavigate('scheme-details', card.id)}
          className="flex-1 min-w-[90px] text-xs gov-btn-primary py-1.5 text-center"
        >
          View Scheme
        </button>
        <button
          onClick={() => onNavigate('eligibility', card.id)}
          className="flex-1 min-w-[100px] text-xs gov-btn-secondary py-1.5 text-center"
        >
          Check Eligibility
        </button>
      </div>
    </div>
  );
}
