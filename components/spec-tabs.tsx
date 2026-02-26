'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExecutableSpec } from '@/lib/types';
import { FileText, Link2, Shield, TestTube2 } from 'lucide-react';

interface SpecTabsProps {
  spec: ExecutableSpec;
  className?: string;
}

const TABS = [
  { id: 'narrative', label: 'Narrative', icon: FileText, description: 'Human-readable spec' },
  { id: 'context', label: 'Context Evidence', icon: Link2, description: 'RAG-grounded sources' },
  { id: 'constraints', label: 'Constraints', icon: Shield, description: 'DO NOT rules' },
  { id: 'gherkin', label: 'Gherkin Tests', icon: TestTube2, description: 'Acceptance tests' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SpecTabs({ spec, className }: SpecTabsProps) {
  const [active, setActive] = useState<TabId>('narrative');

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab list */}
      <div
        className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Spec layers"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              active === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {/* Narrative */}
        <div
          id="panel-narrative"
          role="tabpanel"
          aria-labelledby="tab-narrative"
          hidden={active !== 'narrative'}
        >
          {active === 'narrative' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{spec.narrative.title}</h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Narrative Layer
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Objective</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{spec.narrative.objective}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Why We're Building This</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{spec.narrative.rationale}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context Evidence */}
        <div
          id="panel-context"
          role="tabpanel"
          aria-labelledby="tab-context"
          hidden={active !== 'context'}
        >
          {active === 'context' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-400">
                  {spec.contextPointers.length} source{spec.contextPointers.length !== 1 ? 's' : ''} referenced
                </span>
              </div>
              {spec.contextPointers.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No sources referenced.</p>
              ) : (
                spec.contextPointers.map((ptr, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {ptr.source}
                      </span>
                      {ptr.link && (
                        <a
                          href={ptr.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                          <Link2 className="h-3 w-3" />
                          View source
                        </a>
                      )}
                    </div>
                    <blockquote className="text-sm text-slate-300 italic border-l-2 border-emerald-500/40 pl-3 leading-relaxed">
                      "{ptr.snippet}"
                    </blockquote>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Constraints */}
        <div
          id="panel-constraints"
          role="tabpanel"
          aria-labelledby="tab-constraints"
          hidden={active !== 'constraints'}
        >
          {active === 'constraints' && (
            <div className="space-y-3">
              {spec.constraints.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No constraints defined.</p>
              ) : (
                spec.constraints.map((constraint, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-xl border-2',
                      constraint.severity === 'critical'
                        ? 'border-red-500/40 bg-red-500/5'
                        : constraint.severity === 'warning'
                        ? 'border-yellow-500/40 bg-yellow-500/5'
                        : 'border-blue-500/40 bg-blue-500/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-white">
                        <span className="text-red-400">DO NOT: </span>
                        {constraint.rule}
                      </p>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full uppercase font-bold flex-shrink-0',
                          constraint.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : constraint.severity === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        )}
                      >
                        {constraint.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{constraint.rationale}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Gherkin Tests */}
        <div
          id="panel-gherkin"
          role="tabpanel"
          aria-labelledby="tab-gherkin"
          hidden={active !== 'gherkin'}
        >
          {active === 'gherkin' && (
            <div className="space-y-4">
              {spec.verification.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No test scenarios defined.</p>
              ) : (
                spec.verification.map((scenario, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
                      <p className="text-xs font-mono text-slate-300">
                        <span className="text-purple-400">Scenario:</span> {scenario.scenario}
                      </p>
                    </div>
                    <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                      {scenario.given.map((g, j) => (
                        <div key={j}>
                          <span className="text-blue-400">{j === 0 ? 'Given' : 'And'}</span>
                          <span className="text-slate-300"> {g}</span>
                          {'\n'}
                        </div>
                      ))}
                      {scenario.when.map((w, j) => (
                        <div key={j}>
                          <span className="text-yellow-400">{j === 0 ? 'When' : 'And'}</span>
                          <span className="text-slate-300"> {w}</span>
                          {'\n'}
                        </div>
                      ))}
                      {scenario.then.map((t, j) => (
                        <div key={j}>
                          <span className="text-emerald-400">{j === 0 ? 'Then' : 'And'}</span>
                          <span className="text-slate-300"> {t}</span>
                          {'\n'}
                        </div>
                      ))}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
