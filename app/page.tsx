import Link from 'next/link';
import {
  ArrowRight, Zap, Shield, GitBranch, CheckCircle,
  Target, Terminal, Quote, ChevronDown, Star, Layers
} from 'lucide-react';

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

const FOUR_LAYERS = [
  {
    number: '01',
    title: 'Narrative Layer',
    subtitle: 'Human-readable',
    description: 'Clear objective and rationale that every stakeholder — from CEO to intern — can understand.',
    color: 'emerald',
    example: '"Enable users to bulk-delete documents to reduce manual cleanup time for enterprise accounts."',
  },
  {
    number: '02',
    title: 'Context Pointer Layer',
    subtitle: 'RAG-grounded evidence',
    description: 'Every requirement is linked to its source — Slack messages, Jira tickets, user interviews.',
    color: 'blue',
    example: 'Source: Slack #product-feedback — "Enterprise customers keep asking for bulk delete" (Sarah, Jan 12)',
  },
  {
    number: '03',
    title: 'Constraint Layer',
    subtitle: 'DO NOT rules',
    description: 'Tribal knowledge surfaced automatically. The "don\'t touch this" rules that live in engineers\' heads.',
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

const BEFORE_AFTER = {
  before: {
    title: 'Before: Slack Chaos',
    items: [
      { who: 'sarah', text: 'Hey, can we add bulk delete? Enterprise customers keep asking 😅' },
      { who: 'mike', text: 'Seems straightforward, maybe 3-4 days?' },
      { who: 'sarah', text: 'Ship it! 🚀' },
      { who: 'buried', text: '⚠️ Critical thread buried 3 months ago: "Bulk ops bypass permission checks — fix before shipping any bulk feature" — @dave' },
    ],
  },
  after: {
    title: 'After: Executable Spec',
    items: [
      { label: '📖 Narrative', text: 'Enable bulk document deletion for enterprise cleanup workflows' },
      { label: '🔗 Context', text: 'Linked to: Slack thread (Sarah), Zendesk #4521 ($50k ARR customer), GitHub Issue #892' },
      { label: '🚫 Constraint', text: '[CRITICAL] Permission checks must be applied on bulk endpoint before shipping' },
      { label: '✅ Test', text: 'Given editor role / When bulk delete 3 docs / Then only owned docs deleted' },
    ],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-white">Specwright</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
          </div>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-semibold rounded-lg transition-all"
          >
            Try the Demo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20
                          rounded-full text-emerald-400 text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Cursor for Product Management
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            From Slack Chaos to{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Agent-Ready Specs
            </span>{' '}
            in Minutes
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            AI coding tools made writing code nearly free. The bottleneck shifted upstream.
            Specwright synthesizes scattered context into{' '}
            <span className="text-white font-medium">executable specifications</span>
            {' '}— four-layer structured instructions that AI agents can implement without hallucinating.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500
                         text-white font-semibold rounded-xl transition-all hover:scale-105
                         shadow-lg shadow-emerald-500/20 text-base"
              aria-label="Try the demo"
            >
              Try the Demo — It's Free
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 border border-slate-600
                         hover:border-slate-500 text-slate-300 hover:text-white font-semibold
                         rounded-xl transition-all text-base"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: '10x', label: 'Faster spec writing' },
              { value: '90%', label: 'Fewer hallucinations' },
              { value: '0', label: 'Context lost' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
      </section>

      {/* Before / After */}
      <section id="how-it-works" className="py-20 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See the Transformation
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Real Slack thread → real executable spec. This exact pattern caught a $220K permissions bug
              before a single line of code was written.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Before */}
            <div className="rounded-2xl border-2 border-red-500/20 bg-red-500/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-red-500/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-red-400">{BEFORE_AFTER.before.title}</span>
              </div>
              <div className="p-5 space-y-3">
                {BEFORE_AFTER.before.items.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      item.who === 'buried'
                        ? 'bg-red-500/15 border border-red-500/30 text-red-300 font-medium'
                        : 'bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    {item.who !== 'buried' && (
                      <span className="text-slate-500 font-mono text-xs">@{item.who}: </span>
                    )}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-emerald-500/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-emerald-400">{BEFORE_AFTER.after.title}</span>
              </div>
              <div className="p-5 space-y-3">
                {BEFORE_AFTER.after.items.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg text-sm bg-slate-800/60">
                    <span className="text-slate-400 text-xs font-medium block mb-1">{item.label}</span>
                    <span className="text-slate-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Layers */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Executable Spec: Four Layers
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              An executable spec isn't a static document — it's a living, linked, machine-readable
              instruction set that AI agents can implement directly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FOUR_LAYERS.map((layer) => (
              <div
                key={layer.number}
                className="group p-5 rounded-2xl bg-slate-800/40 border border-slate-700
                           hover:border-slate-500 transition-all hover:bg-slate-800/60"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-3xl font-black text-${layer.color}-500/30 group-hover:text-${layer.color}-500/50 transition-colors`}>
                    {layer.number}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${layer.color}-500/10 text-${layer.color}-400 font-medium`}>
                    {layer.subtitle}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{layer.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{layer.description}</p>
                <div className={`p-3 rounded-lg bg-${layer.color}-500/5 border border-${layer.color}-500/20`}>
                  <p className={`text-xs text-${layer.color}-400/80 font-mono leading-relaxed italic`}>
                    {layer.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Integration callout */}
      <section className="py-16 bg-slate-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative p-8 md:p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent)]" aria-hidden="true" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="p-4 rounded-xl bg-emerald-500/15 flex-shrink-0">
                <Terminal className="h-8 w-8 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    MCP Integration
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                    USB-C for AI
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Works Inside Cursor and Claude Desktop
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Specwright exposes your specs via the Model Context Protocol (MCP) — Anthropic's standard
                  for AI context. Your Cursor IDE pulls specs automatically. No copy-paste, no context drift.
                </p>
              </div>
              <Link
                href="/demo"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-emerald-600
                           hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Set up MCP
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Teams Building With Specwright
            </h2>
            <p className="text-slate-500">Early access beta — join the waitlist</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {BETA_QUOTES.map((q, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <Quote className="h-5 w-5 text-emerald-500/50 mb-4" aria-hidden="true" />
                <p className="text-sm text-slate-300 leading-relaxed mb-5 italic">"{q.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{q.author}</p>
                    <p className="text-xs text-slate-500">{q.role}</p>
                  </div>
                  <div className="flex" aria-label={`${q.rating} stars`}>
                    {Array.from({ length: q.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA section */}
      <section id="demo" className="py-20 bg-slate-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20
                          rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            No signup required
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Generate Your First Spec in 60 Seconds
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Paste a Slack thread, meeting notes, or describe a feature. Watch Specwright harvest
            context, draft the spec, run an adversarial review, and produce Gherkin tests.
          </p>
          <p className="text-xs text-slate-600 mb-8">
            Best with 100–200 words of context per feature. The more signal, the better the spec.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-10 py-4 bg-emerald-600 hover:bg-emerald-500
                       text-white font-bold rounded-xl transition-all hover:scale-105
                       shadow-xl shadow-emerald-500/20 text-lg"
          >
            Generate Your First Spec
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Start free. Scale when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Concierge',
                price: '$2,500',
                period: '/month',
                description: 'We handle spec creation for your team manually. Fastest path to value.',
                features: ['Unlimited spec requests', 'Human-reviewed output', 'Dedicated Slack channel', 'Custom constraints'],
                cta: 'Book a call',
                href: 'mailto:hello@specwright.ai',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$50',
                period: '/month',
                description: 'Full automation. Generate specs directly from your tools.',
                features: ['Unlimited specs', 'MCP server access', 'Jira + Slack ingestion', 'Pre-code simulation'],
                cta: 'Start free trial',
                href: '/demo',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'SSO, RBAC, audit trails, and dedicated infrastructure.',
                features: ['Everything in Pro', 'SSO + RBAC', 'SOC 2 compliance', 'Dedicated support'],
                cta: 'Contact us',
                href: 'mailto:enterprise@specwright.ai',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl border transition-all ${
                  plan.highlight
                    ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-slate-700 bg-slate-800/30'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full mb-3">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Layers className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </div>
                <span className="font-bold text-white">Specwright</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The context intelligence platform that transforms chaos into agent-ready specifications.
              </p>
            </div>
            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Demo', href: '/demo' },
                  { label: 'Dashboard', href: '/dashboard' },
                ],
              },
              {
                heading: 'Docs',
                links: [
                  { label: 'Documentation', href: '#' },
                  { label: 'MCP Setup', href: '#' },
                  { label: 'API Reference', href: '#' },
                  { label: 'Blog', href: '#' },
                ],
              },
              {
                heading: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Contact', href: 'mailto:hello@specwright.ai' },
                  { label: 'Privacy', href: '#' },
                  { label: 'Terms', href: '#' },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {col.heading}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © 2026 Specwright. Built by Shreyansh.
            </p>
            <p className="text-xs text-slate-700">
              Powered by Claude + MCP + Qdrant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
