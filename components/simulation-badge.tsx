'use client';

import { cn } from '@/lib/utils';

interface SimulationBadgeProps {
  score: number;
  passed: boolean;
  totalScenarios?: number;
  passedScenarios?: number;
  className?: string;
}

export function SimulationBadge({
  score,
  passed,
  totalScenarios,
  passedScenarios,
  className,
}: SimulationBadgeProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-4 px-5 py-4 rounded-xl border',
        getScoreBg(),
        className
      )}
      role="status"
      aria-label={`Simulation score: ${score} out of 100. ${passed ? 'Passed' : 'Failed'}`}
    >
      <div className="relative flex-shrink-0" aria-hidden="true">
        <svg width="72" height="72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="36"
            cy="36"
            r="28"
            fill="none"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            className={cn('transition-all duration-1000', getScoreColor())}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', getScoreColor())}>{score}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
              passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full inline-block', passed ? 'bg-emerald-400' : 'bg-red-400')} />
            {passed ? 'SIMULATION PASSED' : 'SIMULATION FAILED'}
          </span>
        </div>
        <p className="text-sm font-semibold text-white">Score: {score}/100</p>
        {totalScenarios !== undefined && (
          <p className="text-xs text-slate-400 mt-0.5">
            {passedScenarios}/{totalScenarios} scenarios passed
          </p>
        )}
      </div>
    </div>
  );
}
