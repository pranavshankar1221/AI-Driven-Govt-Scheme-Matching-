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
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#004b87] dark:border-sky-400 border-t-transparent animate-spin flex-shrink-0" />
        );
      case 'failed':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
            !
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" />
        );
    }
  };

  const getStatusTextColor = (status: AgentProgressStatus) => {
    switch (status) {
      case 'completed':
        return 'theme-text-main font-medium';
      case 'in_progress':
        return 'text-[#004b87] dark:text-sky-300 font-semibold';
      case 'failed':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'pending':
      default:
        return 'theme-text-muted';
    }
  };

  return (
    <div className={`theme-card-subtle rounded-md p-3 my-2 border theme-border shadow-sm ${className}`}>
      <div className="flex items-center justify-between pb-1.5 border-b theme-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-[#004b87] dark:bg-sky-400 animate-pulse'}`} />
          <span className="text-[11px] font-bold theme-text-main uppercase tracking-wider">
            {isComplete ? 'Eligibility Evaluation Completed' : 'Evaluating Citizen Eligibility Criteria'}
          </span>
        </div>
        <span className="text-[10px] theme-text-muted font-mono font-medium">
          {steps.filter(s => s.status === 'completed').length}/{steps.length}
        </span>
      </div>

      <div className="space-y-1.5 pt-1.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
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
