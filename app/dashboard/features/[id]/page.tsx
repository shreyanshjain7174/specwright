'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, MessageSquare, Clock, Loader2, Sparkles,
  Database, GitBranch, CheckCircle2, RotateCcw, AlertCircle,
  Shield, ChevronDown, ChevronUp, X, Layers
} from 'lucide-react';
import { SpecTabs } from '@/components/spec-tabs';
import { TraceabilityGraph } from '@/components/traceability-graph';
import { ExportButtons } from '@/components/export-buttons';
import { ExecutableSpec } from '@/lib/types';

interface RawInput {
  id: string;
  source: string;
  content: string;
  createdAt: string;
}

interface Specification {
  id: string;
  details: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  version: number;
  parsed?: ExecutableSpec | null;
}

interface FeatureDetailData {
  feature: { id: string; name: string; description?: string };
  specifications: Specification[];
  rawInputs: RawInput[];
  traceability: {
    totalRawInputs: number;
    totalSpecs: number;
    sources: string[];
  };
}

// Approval modal
function ApprovalModal({
  specVersion,
  onConfirm,
  onClose,
}: {
  specVersion: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Approve Spec v{specVersion}</h2>
        </div>
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-5">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-400 mb-1">Approval is immutable</p>
              <p className="text-slate-400 leading-relaxed">
                Once approved, this spec version is locked for audit purposes. Future changes
                will create a new version (v{specVersion + 1}), preserving this one.
                This is by design — approved specs are your source of truth.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            ✓ Approve This Version
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-generate confirm modal
function RegenModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Re-generate Spec?</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          This will create a new spec version based on all current context.
          The existing version will be preserved in the change log.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Re-generate
          </button>
        </div>
      </div>
    </div>
  );
}

function tryParseSpec(details: string): ExecutableSpec | null {
  try {
    const parsed = JSON.parse(details);
    if (parsed && parsed.narrative) return parsed as ExecutableSpec;
  } catch {}
  return null;
}

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<FeatureDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSpecIdx, setActiveSpecIdx] = useState(0);
  const [showApprove, setShowApprove] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [approvedVersions, setApprovedVersions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'spec' | 'traceability' | 'inputs' | 'changelog'>('spec');
  const [regenLoading, setRegenLoading] = useState(false);
  const [expandedInput, setExpandedInput] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/specs/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureName: id }),
        });
        const json = await res.json();
        if (res.ok && json.spec) {
          const d = json.spec as FeatureDetailData;
          // Add version numbers to specs
          const withVersions = (d.specifications || []).map((s, i) => ({
            ...s,
            version: i + 1,
            parsed: tryParseSpec(s.details),
          }));
          setData({ ...d, specifications: withVersions });
        } else {
          setError(json.error || 'Failed to load feature');
        }
      } catch {
        setError('Network error — check your connection');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleApprove = () => {
    if (!data) return;
    const spec = data.specifications[activeSpecIdx];
    if (!spec) return;
    setApprovedVersions((prev) => new Set([...prev, spec.id]));
    setShowApprove(false);
  };

  const handleRegen = async () => {
    setShowRegen(false);
    setRegenLoading(true);
    // Simulate regeneration
    await new Promise((r) => setTimeout(r, 2000));
    setRegenLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 text-slate-500 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading feature…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Database className="h-12 w-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-400 mb-4">{error || 'Feature not found'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500
                       text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeSpec = data.specifications[activeSpecIdx];
  const parsedSpec = activeSpec?.parsed;
  const isApproved = activeSpec && approvedVersions.has(activeSpec.id);

  const DETAIL_TABS = [
    { id: 'spec', label: 'Spec Viewer', icon: FileText },
    { id: 'traceability', label: 'Traceability', icon: GitBranch },
    { id: 'inputs', label: `Context (${data.rawInputs.length})`, icon: MessageSquare },
    { id: 'changelog', label: 'Change Log', icon: Clock },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {showApprove && activeSpec && (
        <ApprovalModal
          specVersion={activeSpec.version}
          onConfirm={handleApprove}
          onClose={() => setShowApprove(false)}
        />
      )}
      {showRegen && (
        <RegenModal onConfirm={handleRegen} onClose={() => setShowRegen(false)} />
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </Link>
              <span className="text-slate-700 hidden sm:inline" aria-hidden="true">/</span>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white truncate">{data.feature.name}</h1>
                {data.feature.description && (
                  <p className="text-xs text-slate-500 hidden sm:block truncate">{data.feature.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/ingest?featureId=${id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-700
                           hover:border-slate-600 text-slate-400 hover:text-white text-sm rounded-lg transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Add Context</span>
              </Link>
              {activeSpec && !isApproved && (
                <>
                  <button
                    onClick={() => setShowRegen(true)}
                    disabled={regenLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-blue-500/30
                               bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm rounded-lg transition-all"
                    aria-label="Re-generate spec"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${regenLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span className="hidden sm:inline">{regenLoading ? 'Generating…' : 'Re-generate'}</span>
                  </button>
                  <button
                    onClick={() => setShowApprove(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600
                               hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-all"
                    aria-label="Approve this spec version"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Approve</span>
                  </button>
                </>
              )}
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10
                                 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approved
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Raw Inputs', value: data.traceability.totalRawInputs, color: 'blue' },
            { label: 'Spec Versions', value: data.traceability.totalSpecs, color: 'purple' },
            { label: 'Source Types', value: data.traceability.sources.length, color: 'emerald' },
          ].map((s) => (
            <div key={s.label} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-center">
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Version selector (if multiple specs) */}
        {data.specifications.length > 1 && (
          <div className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
            <GitBranch className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-slate-400 flex-shrink-0">Version:</span>
            <div className="flex gap-2 flex-wrap">
              {data.specifications.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSpecIdx(i)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    i === activeSpecIdx
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-700 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={i === activeSpecIdx}
                >
                  v{s.version}
                  {approvedVersions.has(s.id) && (
                    <span className="ml-1 text-emerald-400" aria-label="approved">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detail tabs */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Tab list */}
          <div className="flex border-b border-slate-700 overflow-x-auto" role="tablist">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`detail-panel-${tab.id}`}
                id={`detail-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panels */}
          <div className="p-5">
            {/* Spec Viewer */}
            <div
              id="detail-panel-spec"
              role="tabpanel"
              aria-labelledby="detail-tab-spec"
              hidden={activeTab !== 'spec'}
            >
              {activeTab === 'spec' && (
                <>
                  {parsedSpec ? (
                    <div className="space-y-4">
                      <SpecTabs spec={parsedSpec} className="min-h-96" />
                      <ExportButtons spec={parsedSpec} />
                    </div>
                  ) : activeSpec ? (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900 rounded-xl p-4 overflow-auto max-h-96">
                      {activeSpec.details}
                    </pre>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No spec generated yet.</p>
                      <p className="text-slate-600 text-xs mt-1">Use the Demo page or MCP server to generate a spec.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Traceability */}
            <div
              id="detail-panel-traceability"
              role="tabpanel"
              aria-labelledby="detail-tab-traceability"
              hidden={activeTab !== 'traceability'}
            >
              {activeTab === 'traceability' && (
                <>
                  <p className="text-xs text-slate-500 mb-4">
                    Visual connections between spec requirements and source evidence.
                    Click any node to expand its details.
                  </p>
                  {parsedSpec ? (
                    <TraceabilityGraph spec={parsedSpec} />
                  ) : (
                    <div className="text-center py-12">
                      <GitBranch className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Generate a spec first to see the traceability graph.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Inputs */}
            <div
              id="detail-panel-inputs"
              role="tabpanel"
              aria-labelledby="detail-tab-inputs"
              hidden={activeTab !== 'inputs'}
            >
              {activeTab === 'inputs' && (
                <div className="space-y-3">
                  {data.rawInputs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
                      <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm mb-3">No context ingested yet.</p>
                      <Link
                        href={`/dashboard/ingest?featureId=${id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500
                                   text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Add Context
                      </Link>
                    </div>
                  ) : (
                    data.rawInputs.map((input) => {
                      const isExpanded = expandedInput === input.id;
                      return (
                        <div key={input.id} className="border border-slate-700 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors text-left"
                            onClick={() => setExpandedInput(isExpanded ? null : input.id)}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full font-medium border border-blue-500/20">
                                {input.source}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(input.createdAt).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              <span className="text-xs text-slate-600 truncate max-w-40 hidden sm:inline">
                                {input.content.slice(0, 60)}…
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900 rounded-lg p-3 max-h-64 overflow-y-auto">
                                {input.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Change log */}
            <div
              id="detail-panel-changelog"
              role="tabpanel"
              aria-labelledby="detail-tab-changelog"
              hidden={activeTab !== 'changelog'}
            >
              {activeTab === 'changelog' && (
                <div className="space-y-3">
                  {data.specifications.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-8">No versions yet.</p>
                  ) : (
                    [...data.specifications].reverse().map((spec) => {
                      const approved = approvedVersions.has(spec.id);
                      return (
                        <div
                          key={spec.id}
                          className={`p-4 rounded-xl border transition-all ${
                            approved
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-slate-700 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-white">v{spec.version}</span>
                              {approved && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20
                                                 border border-emerald-500/30 text-emerald-400 text-xs rounded-full font-medium">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {new Date(spec.createdAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {approved && spec.approvedBy && (
                            <p className="text-xs text-slate-400 mt-1">Approved by {spec.approvedBy}</p>
                          )}
                          {!approved && (
                            <p className="text-xs text-slate-600 mt-1">Generated — pending approval</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adversarial review panel (if spec has constraints) */}
        {parsedSpec && parsedSpec.constraints.length > 0 && (
          <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-red-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-white">Adversarial Review Results</h2>
              <span className="text-xs text-slate-500">— constraints surface in review</span>
            </div>
            <div className="grid gap-3">
              {parsedSpec.constraints.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border-l-4 ${
                    c.severity === 'critical'
                      ? 'border-l-red-500 bg-red-500/5'
                      : c.severity === 'warning'
                      ? 'border-l-yellow-500 bg-yellow-500/5'
                      : 'border-l-blue-500 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                      c.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : c.severity === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {c.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{c.rule}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.rationale}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
