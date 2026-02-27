'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, AlertCircle, Zap, Terminal,
  Copy, Check, X, ChevronDown, Layers
} from 'lucide-react';
import { ExecutableSpec, SimulationResult } from '@/lib/types';
import { SpecTabs } from '@/components/spec-tabs';
import { SimulationBadge } from '@/components/simulation-badge';
import { ExportButtons } from '@/components/export-buttons';
import { ProgressStepper } from '@/components/progress-stepper';
import { DocumentUpload } from '@/components/DocumentUpload';
import { RetrievalTraces } from '@/components/RetrievalTraces';
import { SlackIcon, JiraIcon, GongIcon } from '@/components/icons/ConnectorIcons';

// ── Demo examples ──────────────────────────────────────────────────────────────
const DEMO_EXAMPLES: Record<string, { label: string; shortLabel: string; source: string; content: string; icon?: React.FC<{ className?: string }> }> = {
  slack: {
    label: 'Slack — Bulk Delete Bug',
    shortLabel: 'Bulk Delete',
    source: 'slack',
    icon: SlackIcon,
    content: `[Slack #product-feedback]
@sarah: Hey, can we add bulk delete for documents? Our enterprise customers keep asking for it.
@mike: Seems straightforward, maybe 3-4 days?
@sarah: Ship it! 🚀

[GitHub Issue #892]
Title: Add bulk document deletion
Description: Users want to delete multiple documents at once. Should be simple – just loop through and delete.

[Zendesk Ticket #4521]
Customer: "We need to clean up old files but it's taking forever one by one"
Note: Enterprise customer, $50k ARR

[Engineering Slack – buried 3 months ago]
@dave: Remember guys, our permission system checks are only on single-doc endpoints. Bulk operations bypass them currently. TODO: fix before we add any bulk features.`,
  },
  jira: {
    label: 'Jira — Dark Mode Feature',
    shortLabel: 'Dark Mode',
    source: 'jira',
    icon: JiraIcon,
    content: `[JIRA-1204] Dark Mode Support
Priority: High
Reporter: PM Team
Assignee: Frontend Team

Description:
Users have requested dark mode. Should be a simple toggle in settings.

Customer feedback:
- "My eyes hurt using the app at night" — 47 upvotes
- "Would love dark mode, the white background is blinding" — 32 upvotes

Technical notes from previous sprint:
- Our chart library (v3.x) renders on transparent background — text invisible in dark mode
- Brand Blue (#0052CC) does not invert well — maintain brand color in dark theme
- CSS custom properties are already set up for theming (--color-bg, --color-text)

Acceptance: User can toggle between light and dark mode. Preference persists on refresh.`,
  },
  acme: {
    label: 'Enterprise — Audit Log (SOC 2)',
    shortLabel: 'Audit Log',
    source: 'manual',
    content: `Enterprise client Acme Corp is threatening to churn. Security team flagged we don't have audit logs. They need every user action with timestamps, user IDs, and IP addresses. Must be exportable to CSV for SOC 2 compliance audit in 6 weeks.

Constraints from customer call:
- DO NOT store logs in the same DB as user data (compliance isolation)
- DO NOT allow audit log deletion by any user including admins
- DO NOT expose raw SQL or internal system events
- Must retain logs for minimum 7 years
- IP addresses must be masked for GDPR in EU regions

Success criteria:
- Admin can export last 90 days of audit logs to CSV
- Each row includes: timestamp, user_id, email, action, resource_id, ip_address
- Export completes in under 30 seconds for 100k rows
- SOC 2 auditor can verify log integrity via SHA-256 hash`,
  },
  manual: {
    label: 'Manual — SSO Integration',
    shortLabel: 'SSO',
    source: 'manual',
    icon: GongIcon,
    content: `Feature Request: Single Sign-On (SSO) via SAML 2.0

Background:
Enterprise customers are blocked from adopting our product because we don't support SSO.
Two deals worth $80k ARR are blocked on this.

Requirements gathered from sales calls:
- Must support SAML 2.0 (Okta, Azure AD, Google Workspace)
- Just-In-Time (JIT) provisioning required — auto-create accounts on first SSO login
- Existing accounts should be linkable to SSO identity

Constraints from architecture review:
- Do NOT store SAML assertions in our DB — pass-through only (GDPR requirement)
- Session tokens must expire after 8 hours regardless of SSO session state
- Cannot break existing email/password login flow for non-SSO users

Success criteria:
- Enterprise admin can configure SAML from settings panel
- User can log in via SSO and lands on their existing dashboard
- Failed SSO gracefully falls back to error page, not blank screen`,
  },
};

// ── Pipeline steps ──────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { label: 'Harvesting context…', percent: 50, duration: 2000 },
  { label: 'Drafting spec…', percent: 75, duration: 2500 },
  { label: 'Running adversarial review…', percent: 85, duration: 1500 },
  { label: 'Compiling…', percent: 95, duration: 1000 },
  { label: 'Running simulation…', percent: 100, duration: 2000 },
];

// ── MCP Modal ──────────────────────────────────────────────────────────────────
function MCPModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const config = `{
  "mcpServers": {
    "specwright": {
      "command": "npx",
      "args": ["specwright-mcp"],
      "env": {
        "SPECWRIGHT_API_KEY": "your-api-key-here"
      }
    }
  }
}`;

  const copy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring' as const, stiffness: 350, damping: 30 }}
        className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="h-1 -mt-6 -mx-6 mb-5 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Connect to Cursor</h2>
          </div>
          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <ol className="space-y-4 mb-5">
          {[
            { step: '1', title: 'Install the MCP package', code: 'npm install -g specwright-mcp' },
            {
              step: '2',
              title: 'Add to Cursor settings',
              subtitle: 'Open Cursor → Settings → MCP → Add server:',
              code: config,
            },
            { step: '3', title: 'Restart Cursor', subtitle: 'Your specs will be available in every chat automatically.' },
          ].map((item) => (
            <li key={item.step} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                {item.subtitle && <p className="text-xs text-slate-400 mb-1.5">{item.subtitle}</p>}
                {item.code && (
                  <div className="relative">
                    <pre className="text-xs font-mono bg-black/20 border border-white/[0.06] rounded-lg p-3 overflow-x-auto text-slate-300">
                      {item.code}
                    </pre>
                    {item.step === '2' && (
                      <button
                        onClick={copy}
                        className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-all"
                        aria-label="Copy config"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          Got it — close
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
type Stage = 'idle' | 'running' | 'done' | 'error';

interface UploadedDoc {
  docId: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  pageCount?: number;
}

interface RetrievalSource {
  method: 'direct' | 'pageindex';
  source: string;
  traces?: Array<{
    node_id: string;
    title: string;
    page_range: [number, number];
    reasoning: string;
    content: string;
  }>;
}

export default function DemoPage() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('slack');
  const [featureName, setFeatureName] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [spec, setSpec] = useState<ExecutableSpec | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMCP, setShowMCP] = useState(false);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [retrievalSources, setRetrievalSources] = useState<RetrievalSource[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const loadExample = (key: string) => {
    const ex = DEMO_EXAMPLES[key];
    if (ex) {
      setContent(ex.content);
      setSource(ex.source);
      setFeatureName(ex.label.split(' — ')[1] || '');
    }
  };

  const handleDocumentUploaded = (doc: UploadedDoc) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.docId !== docId));
  };

  const simulate = async () => {
    if (!content.trim()) return;
    setStage('running');
    setProgress(0);
    setSpec(null);
    setSimulation(null);
    setError(null);
    setRetrievalSources([]);

    try {
      for (const step of PIPELINE_STEPS) {
        await new Promise<void>((resolve) => {
          setProgress(step.percent);
          setTimeout(resolve, step.duration);
        });
      }

      const readyDocIds = documents
        .filter((d) => d.status === 'completed')
        .map((d) => d.docId);

      const compileRes = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: content,
          documentIds: readyDocIds.length > 0 ? readyDocIds : undefined,
        }),
      });

      const compileData = await compileRes.json();
      if (compileData.error) throw new Error(compileData.error);
      setSpec(compileData.spec);

      if (compileData.retrievalSources) {
        setRetrievalSources(compileData.retrievalSources);
      }

      const simRes = await fetch('/api/specs/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: compileData.spec }),
      });

      const { result, error: simError } = await simRes.json();
      if (simError) throw new Error(simError);
      setSimulation(result);

      setStage('done');

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  };

  const isRunning = stage === 'running';
  const isDone = stage === 'done';

  const simulationScore = simulation
    ? Math.round((simulation.passedScenarios / Math.max(simulation.totalScenarios, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showMCP && <MCPModal onClose={() => setShowMCP(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/[0.04] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.06] hidden sm:block" aria-hidden="true" />
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Live Demo
              </h1>
              <p className="text-xs text-slate-600 hidden sm:block">Paste context → get executable specs in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-white/[0.06]
                         hover:border-white/10 text-slate-400 hover:text-white text-sm rounded-lg transition-all"
            >
              Dashboard
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMCP(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10
                         border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-all
                         hover:bg-emerald-500/15"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Connect to Cursor</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Input section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          aria-label="Spec generation input"
        >
          <div className="space-y-4">
            {/* Example loader */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Load example:</span>
              {Object.entries(DEMO_EXAMPLES).map(([key, ex]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => loadExample(key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#111827] hover:bg-white/[0.06]
                             border border-white/[0.06] hover:border-white/10 text-slate-400 hover:text-white
                             rounded-lg transition-all"
                >
                  {ex.icon && <ex.icon className="w-3 h-3" />}
                  {ex.shortLabel}
                </motion.button>
              ))}
            </div>

            {/* Textarea + source selector */}
            <div className="grid md:grid-cols-[1fr_200px] gap-4">
              <div className="relative">
                <label htmlFor="context-input" className="sr-only">Context input</label>
                <textarea
                  id="context-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste a Slack thread, meeting notes, Jira ticket, or describe a feature…&#10;&#10;Best with 100–200 words of context per feature."
                  rows={10}
                  disabled={isRunning}
                  className="w-full px-4 py-3 bg-[#111827] border border-white/[0.06] rounded-xl
                             text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40
                             transition-colors resize-none font-mono disabled:opacity-60"
                />
                {content && (
                  <div className="absolute bottom-3 right-3 text-xs text-slate-700">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="feature-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                    Feature name <span className="text-slate-700">(optional)</span>
                  </label>
                  <input
                    id="feature-name"
                    type="text"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    placeholder="Auto-generated if blank"
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-[#111827] border border-white/[0.06] rounded-lg
                               text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40
                               transition-colors disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="source-select" className="block text-xs font-medium text-slate-400 mb-1.5">
                    Source type
                  </label>
                  <div className="relative">
                    <select
                      id="source-select"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      disabled={isRunning}
                      className="w-full px-3 py-2.5 bg-[#111827] border border-white/[0.06] rounded-lg
                                 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500/40
                                 transition-colors disabled:opacity-60 pr-8"
                    >
                      <option value="slack">Slack</option>
                      <option value="jira">Jira</option>
                      <option value="notion">Notion</option>
                      <option value="gong">Gong</option>
                      <option value="transcript">Transcript</option>
                      <option value="manual">Manual</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                  </div>
                </div>

                {/* Generate button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={simulate}
                  disabled={!content.trim() || isRunning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3
                             bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:from-slate-700 disabled:to-slate-700
                             disabled:cursor-not-allowed text-white font-semibold rounded-xl
                             transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                  aria-label="Generate spec"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Generate Spec
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-slate-700 leading-relaxed">
                  Best with 100–200 words of context. More signal = better spec.
                </p>
              </div>
            </div>

            {/* Document upload */}
            <div className="mt-4 p-4 bg-[#111827] border border-white/[0.06] rounded-xl">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Upload Documents <span className="text-slate-700 font-normal">(optional)</span>
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Upload PDFs for reasoning-based retrieval via PageIndex. The AI will extract relevant context from your documents alongside pasted text.
              </p>
              <DocumentUpload
                documents={documents}
                onDocumentUploaded={handleDocumentUploaded}
                onRemoveDocument={handleRemoveDocument}
                disabled={isRunning}
              />
            </div>
          </div>
        </motion.section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button
                onClick={() => { setError(null); setStage('idle'); }}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {isRunning && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-[#111827] border border-white/[0.06] rounded-2xl"
              aria-label="Generation progress"
            >
              <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                >
                  <Zap className="h-4 w-4 text-emerald-400" />
                </motion.div>
                Generating Executable Spec…
              </h2>
              <ProgressStepper currentPercent={progress} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Output */}
        {isDone && spec && (
          <motion.section
            ref={outputRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            aria-label="Generated spec output"
            className="space-y-5"
          >
            {/* Score + export row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {simulation && (
                <SimulationBadge
                  score={simulationScore}
                  passed={simulation.passed}
                  totalScenarios={simulation.totalScenarios}
                  passedScenarios={simulation.passedScenarios}
                />
              )}
              <ExportButtons
                spec={spec}
                simulation={simulation}
                onConnectCursor={() => setShowMCP(true)}
              />
            </div>

            {/* Failures */}
            {simulation && simulation.failures.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-500/[0.04] border border-red-500/15 rounded-xl space-y-2"
              >
                <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {simulation.failures.length} scenario failure{simulation.failures.length !== 1 ? 's' : ''} detected
                </p>
                {simulation.failures.map((f, i) => (
                  <div key={i} className="pl-6">
                    <p className="text-xs text-red-300 font-medium">{f.scenario}</p>
                    <p className="text-xs text-slate-500">{f.reason}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Suggestions */}
            {simulation && simulation.suggestions.length > 0 && (
              <div className="p-4 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl">
                <p className="text-xs font-semibold text-amber-400 mb-2">💡 Suggestions</p>
                <ul className="space-y-1">
                  {simulation.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-slate-500">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Retrieval sources */}
            {retrievalSources.length > 0 && (
              <div className="p-4 bg-[#111827] border border-white/[0.06] rounded-xl">
                <RetrievalTraces sources={retrievalSources} />
              </div>
            )}

            {/* Tabbed spec viewer */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
              <SpecTabs spec={spec} className="h-full" />
            </div>

            {/* Save to dashboard CTA */}
            <motion.div
              whileHover={{ y: -1 }}
              className="p-4 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-white">Save this spec to your dashboard</p>
                <p className="text-xs text-slate-500">Track versions, approve specs, and connect Cursor via MCP.</p>
              </div>
              <Link
                href="/dashboard"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500
                           text-white font-semibold rounded-lg transition-all text-sm shadow-lg shadow-emerald-500/20
                           hover:shadow-emerald-500/30"
              >
                Open Dashboard
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </motion.div>
          </motion.section>
        )}

        {/* Idle placeholder */}
        <AnimatePresence>
          {stage === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3" aria-hidden="true" />
              </motion.div>
              <p className="text-slate-400 font-medium mb-1">
                Paste context above and click{' '}
                <span className="text-emerald-400">Generate Spec</span>
              </p>
              <p className="text-sm text-slate-700">
                Or load one of the examples to see a real spec generated in seconds
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
