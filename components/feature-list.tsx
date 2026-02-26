'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Plus, ChevronRight, MessageSquare, FileText,
  Clock, Circle, AlertCircle, CheckCircle2, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpecStatus = 'no-spec' | 'draft' | 'simulated' | 'approved';

export interface FeatureItem {
  id: string;
  name: string;
  description?: string;
  raw_input_count: number;
  spec_count: number;
  spec_status?: SpecStatus;
  created_at: string;
  updated_at: string;
}

interface FeatureListProps {
  features: FeatureItem[];
  onCreateClick?: () => void;
  onAddContext?: (featureId: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<SpecStatus, { label: string; icon: typeof Circle; className: string }> = {
  'no-spec': {
    label: 'No Spec',
    icon: Circle,
    className: 'text-slate-400 bg-slate-700/50 border-slate-600',
  },
  draft: {
    label: 'Draft',
    icon: AlertCircle,
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  },
  simulated: {
    label: 'Simulated',
    icon: Cpu,
    className: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
};

function StatusBadge({ status }: { status: SpecStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      <config.icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function FeatureList({ features, onCreateClick, onAddContext, className }: FeatureListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpecStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' || (f.spec_status ?? 'no-spec') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [features, search, statusFilter]);

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search features and specs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                       text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500
                       transition-colors"
            aria-label="Search features"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'no-spec', 'draft', 'simulated', 'approved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                statusFilter === s
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
              )}
              aria-pressed={statusFilter === s}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-400 font-medium mb-1">
            {search || statusFilter !== 'all' ? 'No features match your filters' : 'No features yet'}
          </p>
          <p className="text-slate-600 text-sm mb-5">
            {search || statusFilter !== 'all'
              ? 'Try clearing filters'
              : 'Create your first feature to start ingesting context'}
          </p>
          {!search && statusFilter === 'all' && onCreateClick && (
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500
                         text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Create Feature
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((feature) => {
            const status: SpecStatus = feature.spec_status ?? (feature.spec_count > 0 ? 'draft' : 'no-spec');
            return (
              <div
                key={feature.id}
                className="group flex items-center justify-between p-4 bg-slate-900/50
                           border border-slate-800 rounded-xl hover:border-slate-600 transition-all"
              >
                <Link
                  href={`/dashboard/features/${feature.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {feature.name}
                    </h3>
                    <StatusBadge status={status} />
                  </div>
                  {feature.description && (
                    <p className="text-sm text-slate-500 mb-2 truncate">{feature.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      {feature.raw_input_count} inputs
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      {feature.spec_count} specs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(feature.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {onAddContext && (
                    <button
                      onClick={() => onAddContext(feature.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                                 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium
                                 rounded-lg transition-all"
                      aria-label={`Add context to ${feature.name}`}
                    >
                      + Context
                    </button>
                  )}
                  <Link
                    href={`/dashboard/features/${feature.id}`}
                    className="p-2 text-slate-600 group-hover:text-slate-400 transition-colors"
                    aria-label={`View ${feature.name}`}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-600 mt-3 text-right">
          {filtered.length} of {features.length} feature{features.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
