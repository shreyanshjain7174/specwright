'use client';

import { cn } from '@/lib/utils';

export interface ProgressStep {
  label: string;
  percent: number;
}

const STEPS: ProgressStep[] = [
  { label: 'Harvesting context…', percent: 50 },
  { label: 'Drafting spec…', percent: 75 },
  { label: 'Running adversarial review…', percent: 85 },
  { label: 'Compiling…', percent: 95 },
  { label: 'Running simulation…', percent: 100 },
];

interface ProgressStepperProps {
  currentPercent: number;
  className?: string;
}

export function ProgressStepper({ currentPercent, className }: ProgressStepperProps) {
  const activeStep = STEPS.reduce((acc, step) => {
    if (step.percent <= currentPercent) return step;
    return acc;
  }, STEPS[0]);

  return (
    <div className={cn('space-y-4', className)} role="status" aria-live="polite">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${currentPercent}%` }}
            aria-valuenow={currentPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">0%</span>
          <span className="text-xs text-emerald-400 font-medium">{currentPercent}%</span>
        </div>
      </div>

      {/* Current step label */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex-shrink-0" aria-hidden="true" />
        <span className="text-sm text-slate-300 font-medium">{activeStep.label}</span>
      </div>

      {/* Step list */}
      <div className="space-y-2 pl-1">
        {STEPS.map((step) => {
          const done = step.percent < currentPercent;
          const active = step.percent === activeStep.percent;
          return (
            <div key={step.label} className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0 transition-all',
                  done ? 'bg-emerald-400' : active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-xs transition-colors',
                  done ? 'text-emerald-400 line-through' : active ? 'text-white' : 'text-slate-600'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
