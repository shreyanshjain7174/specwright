import Link from 'next/link';
import {
  ArrowRight, Zap, Shield, GitBranch, CheckCircle,
  Target, Terminal, ChevronDown, Star, Layers, X,
  MessageSquare, FileText, AlertTriangle, Brain
} from 'lucide-react';

// ── Beta quotes ────────────────────────────────────────────────────────────────
const BETA_QUOTES = [
  {
    quote: "We were spending 2 days per feature writing specs. Specwright cut that to 20 minutes and the specs are actually better — they catch constraints we'd always miss.",
    author: "Arjun M.",
    role: "Founder, YC W25 startup",
    rating: 5,
  },
  {
    quote: "The pre-code simulation caught a permissions bypass bug before we wrote a single line of code. That would have been a week of debugging.",
    author: "Priya S.",
    role: "Head of Engineering, Seed-stage SaaS",
    rating: 5,
  },
  {
    quote: "We feed it our Slack threads and it comes back with Gherkin tests we can drop straight into our CI. Cursor loves it.",
    author: "James K.",
    role: "Tech Lead, AI-first product team",
    rating: 5,
  },
];

// ── 4-layer spec definitions ───────────────────────────────────────────────────
const FOUR_LAYERS = [
  {
    number: '01',
    title: 'Narrative Layer',
    subtitle: 'Human-readable',
    description: 'Clear objective and rationale that every stakeholder can understand.',
    color: 'emerald',
    example: '"Enable users to bulk-delete documents to reduce manual cleanup time for enterprise accounts."',
  },
  {
    number: '02',
    title: 'Evidence Layer',
    subtitle: 'RAG-grounded sources',
    description: 'Every requirement is linked to its source — Slack messages, Jira tickets, user interviews.',
    color: 'blue',
    example: 'Source: Slack #product-feedback — "Enterprise customers keep asking for bulk delete" (Sarah, Jan 12)',
  },
  {
    number: '03',
    title: 'Constraint Layer',
    subtitle: 'DO NOT rules',
    description: 'Tribal knowledge surfaced automatically. The rules that live only in engineers\' heads.',
    color: 'red',
    example: '[CRITICAL] DO NOT bypass permission checks on bulk operations — current bulk endpoints skip RLS.',
  },
  {
    number: '04',
    title: 'Verification Layer',
    subtitle: 'Gherkin tests',
    description: 'Acceptance tests your AI agents can implement directly. No ambiguity, no hallucinations.',
    color: 'purple',
    example: 'Given a user with "editor" role / When they select 3 documents / Then only their owned docs are deleted.',
  },
];

// ── Workflow steps ─────────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    num: 1,
    title: 'Paste context',
    desc: 'Slack threads, Jira tickets, Gong call transcripts, meeting notes — anything.',
    icon: MessageSquare,
  },
  {
    num: 2,
    title: 'Harvest & synthesize',
    desc: 'Multi-agent pipeline extracts requirements, constraints, and evidence from your raw context.',
    icon: Brain,
  },
  {
    num: 3,
    title: 'Draft spec',
    desc: 'Every requirement is grounded in real evidence with traceable [SOURCE-ID] citations.',
    icon: FileText,
  },
  {
    num: 4,
    title: 'Simulate & validate',
    desc: 'Pre-code simulation runs 4 validators to catch logic errors before a line is written.',
    icon: AlertTriangle,
  },
  {
    num: 5,
    title: 'Export for your AI agent',
    desc: 'Deliver the locked, SHA-256-signed spec directly to Cursor, Claude, or any AI coding tool via MCP.',
    icon: Terminal,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans scroll-smooth">

      {/* ── NAV ────────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Layers className="h-5 w-5 text-emerald-400" />
            <span>Specwright</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How it works</a>
            <a href="#comparison" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">vs ChatPRD</a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Try Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.1),transparent)]" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: headline + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-6">
                <Zap className="h-3 w-3" />
                Cursor for Product Management
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.08] tracking-tight">
                Your AI Agents Are Waiting for{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Clear Instructions
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Specwright transforms messy Slack threads, customer calls, and meeting notes into{' '}
                <span className="text-white font-medium">executable specifications</span>{' '}
                your AI coding agents can actually follow.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                >
                  Generate Your First Spec
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-xl transition-all"
                >
                  See how it works ↓
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8">
                {[
                  { value: '10x', label: 'Faster spec writing' },
                  { value: '90%', label: 'Fewer AI hallucinations' },
                  { value: '0', label: 'Context lost' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: animated before/after */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl" />
              <div className="relative space-y-4">
                {/* BEFORE */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-500 font-medium">BEFORE — Slack thread</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs text-slate-400">
                    <p><span className="text-blue-400">@sarah:</span> can we add bulk delete for docs?</p>
                    <p><span className="text-green-400">@mike:</span> seems easy, maybe 3-4 days?</p>
                    <p><span className="text-blue-400">@sarah:</span> Ship it! 🚀</p>
                    <p className="text-slate-600 italic text-[10px] mt-2">…3 months of buried context, 1 security bug, $50k ARR at risk</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <div className="h-px flex-1 bg-emerald-500/30" />
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    Specwright
                  </div>
                  <div className="h-px flex-1 bg-emerald-500/30" />
                </div>

                {/* AFTER */}
                <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-4 shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">AFTER — Executable Spec (4 layers)</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-medium shrink-0">01 Narrative:</span>
                      <span className="text-slate-300">Enable bulk-delete for enterprise cleanup</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400 font-medium shrink-0">02 Evidence:</span>
                      <span className="text-slate-300">Slack #product, Zendesk #4521, $50k ARR</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-400 font-medium shrink-0">03 Constraint:</span>
                      <span className="text-slate-300">DO NOT bypass permission checks on bulk ops</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-400 font-medium shrink-0">04 Gherkin:</span>
                      <span className="text-slate-300">Given editor role / When bulk delete / Then only owned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM ─────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why your AI agents keep{' '}
              <span className="text-red-400">hallucinating requirements</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              The problem isn't your AI tools. It's the input you're feeding them.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: MessageSquare,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
                title: 'Scattered context',
                desc: 'Requirements live in Slack, Jira, Notion, email, and engineers\' heads. Your AI agent sees none of it.',
              },
              {
                icon: FileText,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10 border-orange-500/20',
                title: 'Vague specs',
                desc: 'ChatPRD generates documents, not executable intent. "Add dark mode" tells your agent nothing useful.',
              },
              {
                icon: X,
                color: 'text-red-400',
                bg: 'bg-red-500/10 border-red-500/20',
                title: 'No pre-code validation',
                desc: 'Bugs caught in code review cost 10x more than bugs caught in specs. Most teams catch them too late.',
              },
            ].map((item) => (
              <div key={item.title} className={`p-6 rounded-2xl border ${item.bg}`}>
                <item.icon className={`h-8 w-8 ${item.color} mb-4`} />
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Beta quotes */}
          <div className="grid md:grid-cols-3 gap-4">
            {BETA_QUOTES.map((q) => (
              <div key={q.author} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: q.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4 italic">&ldquo;{q.quote}&rdquo;</p>
                <div>
                  <p className="text-white text-sm font-medium">{q.author}</p>
                  <p className="text-slate-500 text-xs">{q.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THE SOLUTION ────────────────────────────────────────────── */}
      <section id="solution" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The 4-layer{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Executable Spec
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Not a document. Not a prompt. A structured, evidence-grounded instruction set
              that AI agents can implement without hallucinating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {FOUR_LAYERS.map((layer) => {
              const colorMap: Record<string, string> = {
                emerald: 'border-emerald-500/30 bg-emerald-500/5',
                blue: 'border-blue-500/30 bg-blue-500/5',
                red: 'border-red-500/30 bg-red-500/5',
                purple: 'border-purple-500/30 bg-purple-500/5',
              };
              const textMap: Record<string, string> = {
                emerald: 'text-emerald-400',
                blue: 'text-blue-400',
                red: 'text-red-400',
                purple: 'text-purple-400',
              };
              return (
                <div key={layer.number} className={`p-6 rounded-2xl border ${colorMap[layer.color]}`}>
                  <div className="flex items-start gap-4">
                    <span className={`text-2xl font-black ${textMap[layer.color]} opacity-60 font-mono`}>{layer.number}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{layer.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${textMap[layer.color]} bg-current/10 border border-current/20 opacity-80`}>
                          {layer.subtitle}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3 leading-relaxed">{layer.description}</p>
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-xs font-mono text-slate-400 italic">{layer.example}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Before/After example */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5 text-center">
              Before vs After — One Real Requirement
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs font-medium text-red-400 mb-2">❌ Raw requirement</p>
                <p className="text-sm text-slate-400 italic font-mono">&ldquo;Add bulk delete for documents&rdquo;</p>
                <p className="text-xs text-slate-600 mt-2">→ AI agent guesses, skips permission checks, ships bug</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-400 mb-2">✅ Executable Spec</p>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-slate-300">📖 Enable bulk-delete for enterprise accounts</p>
                  <p className="text-blue-300">🔗 Source: Slack #product, Zendesk #4521</p>
                  <p className="text-red-300">🚫 DO NOT bypass RLS on bulk endpoints</p>
                  <p className="text-purple-300">✓ Gherkin: Given editor / When bulk / Then owns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: THE WORKFLOW ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-slate-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">Five steps from chaos to clarity — in minutes, not days.</p>
          </div>

          <div className="space-y-3">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.num} className="flex gap-4 items-start p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-slate-600 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-slate-600 font-mono">STEP {step.num}</span>
                    <h3 className="text-white font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: COMPARISON vs ChatPRD ─────────────────────────────────── */}
      <section id="comparison" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Specwright beats ChatPRD
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              ChatPRD generates documents. Specwright generates executable intent.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-slate-500 font-medium">Capability</th>
                  <th className="py-4 px-6 text-center text-slate-400 font-medium">ChatPRD</th>
                  <th className="py-4 px-6 text-center text-emerald-400 font-semibold">Specwright</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  {
                    cap: 'Generation method',
                    chatprd: 'Prompt → Document',
                    sw: 'Context → Executable Spec',
                    swGood: true,
                  },
                  {
                    cap: 'Pre-code validation',
                    chatprd: 'None',
                    sw: 'Pre-code simulation (4 validators)',
                    swGood: true,
                  },
                  {
                    cap: 'Requirement traceability',
                    chatprd: 'Hallucinated',
                    sw: 'Evidence-grounded with citations',
                    swGood: true,
                  },
                  {
                    cap: 'AI coding agent integration',
                    chatprd: 'Standalone (copy/paste)',
                    sw: 'Native MCP (Cursor + Claude)',
                    swGood: true,
                  },
                  {
                    cap: 'Constraint extraction',
                    chatprd: 'Manual',
                    sw: 'Automatic from context',
                    swGood: true,
                  },
                  {
                    cap: 'Gherkin test generation',
                    chatprd: '❌',
                    sw: '✅ Per scenario, auto-generated',
                    swGood: true,
                  },
                ].map((row) => (
                  <tr key={row.cap} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 text-slate-300 font-medium">{row.cap}</td>
                    <td className="py-4 px-6 text-center text-slate-500">{row.chatprd}</td>
                    <td className={`py-4 px-6 text-center font-medium ${row.swGood ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {row.sw}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: CTA + FOOTER ───────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to stop hallucinating requirements?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join teams shipping better features, faster — with specs their AI agents can actually follow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 text-base"
            >
              Generate Your First Spec
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-600 hover:border-emerald-500/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all text-base"
            >
              <Terminal className="h-4 w-4" />
              See the MCP integration
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600">
            {['No credit card required', 'Free to try', 'Real AI output', 'MCP-ready for Cursor'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Specwright</span>
              <span className="text-slate-600 text-sm font-normal ml-1">— Executable specs for AI coding agents</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a
                href="https://github.com/shreyanshjain7174/specwright"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <GitBranch className="h-3.5 w-3.5" />
                GitHub
              </a>
              <a href="mailto:hello@specwright.dev" className="hover:text-white transition-colors">Contact</a>
            </nav>
            <p className="text-slate-600 text-xs">© 2025 Specwright. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
