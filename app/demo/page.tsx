'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Download, AlertCircle, Zap, Terminal,
  Copy, Check, X, ChevronDown
} from 'lucide-react';
import { ExecutableSpec, SimulationResult } from '@/lib/types';
import { SpecTabs } from '@/components/spec-tabs';
import { SimulationBadge } from '@/components/simulation-badge';
import { ExportButtons } from '@/components/export-buttons';
import { ProgressStepper } from '@/components/progress-stepper';

// ── Demo examples ──────────────────────────────────────────────────────────────
const DEMO_EXAMPLES: Record<string, { label: string; source: string; content: string }> = {
  slack: {
    label: 'Slack — Bulk Delete Bug',
    source: 'slack',
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
    source: 'jira',
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
    source: 'manual',
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Connect to Cursor</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
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
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                {item.subtitle && <p className="text-xs text-slate-400 mb-1.5">{item.subtitle}</p>}
                {item.code && (
                  <div className="relative">
                    <pre className="text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto text-slate-300">
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

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          Got it — close
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
type Stage = 'idle' | 'running' | 'done' | 'error';

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
  const outputRef = useRef<HTMLDivElement>(null);

  const loadExample = (key: string) => {
    const ex = DEMO_EXAMPLES[key];
    if (ex) {
      setContent(ex.content);
      setSource(ex.source);
      setFeatureName(ex.label.split(' — ')[1] || '');
    }
  };

  const simulate = async () => {
    if (!content.trim()) return;
    setStage('running');
    setProgress(0);
    setSpec(null);
    setSimulation(null);
    setError(null);

    try {
      // Animate through pipeline steps
      for (const step of PIPELINE_STEPS) {
        await new Promise<void>((resolve) => {
          setProgress(step.percent);
          setTimeout(resolve, step.duration);
        });
      }

      // Compile
      const compileRes = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: content }),
      });

      const { spec: generatedSpec, error: compileError } = await compileRes.json();
      if (compileError) throw new Error(compileError);
      setSpec(generatedSpec);

      // Simulate
      const simRes = await fetch('/api/specs/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: generatedSpec }),
      });

      const { result, error: simError } = await simRes.json();
      if (simError) throw new Error(simError);
      setSimulation(result);

      setStage('done');

      // Scroll to output
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
    <div className="min-h-screen bg-slate-900 text-white">
      {showMCP && <MCPModal onClose={() => setShowMCP(false)} />}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
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
            <div className="h-4 w-px bg-slate-700 hidden sm:block" aria-hidden="true" />
            <div>
              <h1 className="text-base font-bold text-white">Live Demo</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Paste context → get executable specs in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-slate-700
                         hover:border-slate-600 text-slate-400 hover:text-white text-sm rounded-lg transition-all"
            >
              Dashboard
            </Link>
            <button
              onClick={() => setShowMCP(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30
                         border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-all"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Connect to Cursor</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Input section */}
        <section aria-label="Spec generation input">
          <div className="space-y-4">
            {/* Example loader */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Load example:</span>
              {Object.entries(DEMO_EXAMPLES).map(([key, ex]) => (
                <button
                  key={key}
                  onClick={() => loadExample(key)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700
                             border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white
                             rounded-lg transition-all"
                >
                  {ex.label}
                </button>
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                             text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500
                             transition-colors resize-none font-mono disabled:opacity-60"
                />
                {content && (
                  <div className="absolute bottom-3 right-3 text-xs text-slate-600">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {/* Feature name */}
                <div>
                  <label htmlFor="feature-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                    Feature name <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    id="feature-name"
                    type="text"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    placeholder="Auto-generated if blank"
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                               text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500
                               transition-colors disabled:opacity-60"
                  />
                </div>
                {/* Source selector */}
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
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                                 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500
                                 transition-colors disabled:opacity-60 pr-8"
                    >
                      <option value="slack">💬 Slack</option>
                      <option value="jira">🎫 Jira</option>
                      <option value="notion">📝 Notion</option>
                      <option value="gong">📞 Gong</option>
                      <option value="transcript">🎙️ Transcript</option>
                      <option value="manual">✏️ Manual</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={simulate}
                  disabled={!content.trim() || isRunning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3
                             bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                             disabled:cursor-not-allowed text-white font-semibold rounded-xl
                             transition-all hover:shadow-lg hover:shadow-emerald-500/20"
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
                </button>

                {/* Info */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  Best with 100–200 words of context. More signal = better spec.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
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
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <section
            className="p-6 bg-slate-800/40 border border-slate-700 rounded-2xl"
            aria-label="Generation progress"
          >
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              Generating Executable Spec…
            </h2>
            <ProgressStepper currentPercent={progress} />
          </section>
        )}

        {/* Output */}
        {isDone && spec && (
          <section ref={outputRef} aria-label="Generated spec output" className="space-y-5">
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
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {simulation.failures.length} scenario failure{simulation.failures.length !== 1 ? 's' : ''} detected
                </p>
                {simulation.failures.map((f, i) => (
                  <div key={i} className="pl-6">
                    <p className="text-xs text-red-300 font-medium">{f.scenario}</p>
                    <p className="text-xs text-slate-400">{f.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {simulation && simulation.suggestions.length > 0 && (
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <p className="text-xs font-semibold text-yellow-400 mb-2">💡 Suggestions</p>
                <ul className="space-y-1">
                  {simulation.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-slate-400">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabbed spec viewer */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
              <SpecTabs spec={spec} className="h-full" />
            </div>

            {/* Save to dashboard CTA */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Save this spec to your dashboard</p>
                <p className="text-xs text-slate-400">Track versions, approve specs, and connect Cursor via MCP.</p>
              </div>
              <Link
                href="/dashboard"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600
                           hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all text-sm"
              >
                Open Dashboard
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </section>
        )}

        {/* Idle placeholder */}
        {stage === 'idle' && (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl">
            <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-400 font-medium mb-1">
              Paste context above and click{' '}
              <span className="text-emerald-400">Generate Spec</span>
            </p>
            <p className="text-sm text-slate-600">
              Or load one of the examples to see a real spec generated in seconds
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
