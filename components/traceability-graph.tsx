'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExecutableSpec } from '@/lib/types';
import { FileText, Link2, Shield, TestTube2, ChevronDown, ChevronUp } from 'lucide-react';

interface TraceabilityGraphProps {
  spec: ExecutableSpec;
  className?: string;
}

interface NodeData {
  id: string;
  type: 'spec' | 'source' | 'constraint' | 'test';
  label: string;
  detail?: string;
  connected?: string[];
}

export function TraceabilityGraph({ spec, className }: TraceabilityGraphProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const specNode: NodeData = {
    id: 'spec',
    type: 'spec',
    label: spec.narrative.title,
    detail: spec.narrative.objective,
  };

  const sourceNodes: NodeData[] = spec.contextPointers.map((p, i) => ({
    id: `src-${i}`,
    type: 'source',
    label: p.source,
    detail: p.snippet,
  }));

  const constraintNodes: NodeData[] = spec.constraints.map((c, i) => ({
    id: `con-${i}`,
    type: 'constraint',
    label: c.rule,
    detail: c.rationale,
  }));

  const testNodes: NodeData[] = spec.verification.map((v, i) => ({
    id: `test-${i}`,
    type: 'test',
    label: v.scenario,
    detail: v.given[0] ? `Given ${v.given[0]}` : undefined,
  }));

  const nodeConfig = {
    spec: { icon: FileText, bg: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60', iconColor: 'text-emerald-400', label: 'Spec' },
    source: { icon: Link2, bg: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60', iconColor: 'text-blue-400', label: 'Source' },
    constraint: { icon: Shield, bg: 'bg-red-500/10 border-red-500/30 hover:border-red-500/60', iconColor: 'text-red-400', label: 'Constraint' },
    test: { icon: TestTube2, bg: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60', iconColor: 'text-purple-400', label: 'Test' },
  };

  function NodeCard({ node }: { node: NodeData }) {
    const config = nodeConfig[node.type];
    const isExpanded = expanded === node.id;
    return (
      <button
        className={cn(
          'w-full text-left p-3 rounded-xl border transition-all',
          config.bg,
          isExpanded && 'ring-1 ring-emerald-500/30'
        )}
        onClick={() => setExpanded(isExpanded ? null : node.id)}
        aria-expanded={isExpanded}
        aria-label={`${config.label}: ${node.label}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <config.icon className={cn('h-3.5 w-3.5 flex-shrink-0', config.iconColor)} aria-hidden="true" />
            <span className="text-xs font-medium text-white truncate">{node.label}</span>
          </div>
          {node.detail && (
            <div className={cn('h-3.5 w-3.5 flex-shrink-0 text-slate-500', config.iconColor)}>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          )}
        </div>
        {isExpanded && node.detail && (
          <p className="text-xs text-slate-400 mt-2 leading-relaxed border-t border-slate-700/50 pt-2 text-left">
            {node.detail}
          </p>
        )}
      </button>
    );
  }

  return (
    <div className={cn('', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sources column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Context Sources ({sourceNodes.length})
            </span>
          </div>
          <div className="space-y-2">
            {sourceNodes.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No sources linked</p>
            ) : (
              sourceNodes.map((n) => <NodeCard key={n.id} node={n} />)
            )}
          </div>
        </div>

        {/* Center: Spec */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spec</span>
          </div>
          <NodeCard node={specNode} />

          {/* Constraints */}
          {constraintNodes.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-3">
                <Shield className="h-4 w-4 text-red-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Constraints ({constraintNodes.length})
                </span>
              </div>
              <div className="space-y-2">
                {constraintNodes.map((n) => <NodeCard key={n.id} node={n} />)}
              </div>
            </>
          )}
        </div>

        {/* Tests column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TestTube2 className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tests ({testNodes.length})
            </span>
          </div>
          <div className="space-y-2">
            {testNodes.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No test scenarios</p>
            ) : (
              testNodes.map((n) => <NodeCard key={n.id} node={n} />)
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-800">
        {(Object.entries(nodeConfig) as [keyof typeof nodeConfig, typeof nodeConfig[keyof typeof nodeConfig]][]).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <config.icon className={cn('h-3 w-3', config.iconColor)} aria-hidden="true" />
            <span className="text-xs text-slate-500">{config.label}</span>
          </div>
        ))}
        <span className="text-xs text-slate-600 ml-auto">Click nodes to expand details</span>
      </div>
    </div>
  );
}
