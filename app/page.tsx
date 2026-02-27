'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  ArrowRight, Zap, Shield, GitBranch, CheckCircle,
  Target, Terminal, ChevronDown, Star, Layers, X,
  MessageSquare, FileText, AlertTriangle, Brain
} from 'lucide-react';
import { SlackIcon, JiraIcon, NotionIcon, GongIcon, ConfluenceIcon } from '@/components/icons/ConnectorIcons';

/* ─── Data ────────────────────────────────────────────────────────────────────── */

const BETA_QUOTES = [
  {
    quote: "We were spending 2 days per feature writing specs. Specwright cut that to 20 minutes and the specs are actually better — they catch constraints we'd always miss.",
    author: 'Arjun M.',
    role: 'Founder, YC W25 startup',
    rating: 5,
  },
  {
    quote: "The pre-code simulation caught a permissions bypass bug before we wrote a single line of code. That would have been a week of debugging.",
    author: 'Priya S.',
    role: 'Head of Engineering, Seed-stage SaaS',
    rating: 5,
  },
  {
    quote: "We feed it our Slack threads and it comes back with Gherkin tests we can drop straight into our CI. Cursor loves it.",
    author: 'James K.',
    role: 'Tech Lead, AI-first product team',
    rating: 5,
  },
];

const FOUR_LAYERS = [
  {
    number: '01', title: 'Narrative Layer', subtitle: 'Human-readable', color: 'emerald',
    description: 'Clear objective and rationale that every stakeholder can understand.',
    example: '"Enable users to bulk-delete documents to reduce manual cleanup time for enterprise accounts."',
  },
  {
    number: '02', title: 'Evidence Layer', subtitle: 'RAG-grounded sources', color: 'blue',
    description: 'Every requirement is linked to its source — Slack messages, Jira tickets, user interviews.',
    example: 'Source: Slack #product-feedback — "Enterprise customers keep asking for bulk delete" (Sarah, Jan 12)',
  },
  {
    number: '03', title: 'Constraint Layer', subtitle: 'DO NOT rules', color: 'red',
    description: "Tribal knowledge surfaced automatically. The rules that live only in engineers' heads.",
    example: '[CRITICAL] DO NOT bypass permission checks on bulk operations — current bulk endpoints skip RLS.',
  },
  {
    number: '04', title: 'Verification Layer', subtitle: 'Gherkin tests', color: 'purple',
    description: 'Acceptance tests your AI agents can implement directly. No ambiguity, no hallucinations.',
    example: 'Given a user with "editor" role / When they select 3 documents / Then only their owned docs are deleted.',
  },
];

const WORKFLOW_STEPS = [
  { num: 1, title: 'Paste context', desc: 'Slack threads, Jira tickets, Gong call transcripts, meeting notes — anything.', icon: MessageSquare },
  { num: 2, title: 'Harvest & synthesize', desc: 'Multi-agent pipeline extracts requirements, constraints, and evidence from your raw context.', icon: Brain },
  { num: 3, title: 'Draft spec', desc: 'Every requirement is grounded in real evidence with traceable [SOURCE-ID] citations.', icon: FileText },
  { num: 4, title: 'Simulate & validate', desc: 'Pre-code simulation runs 4 validators to catch logic errors before a line is written.', icon: AlertTriangle },
  { num: 5, title: 'Export for your AI agent', desc: 'Deliver the locked, SHA-256-signed spec directly to Cursor, Claude, or any AI coding tool via MCP.', icon: Terminal },
];

/* ─── Animation helpers ───────────────────────────────────────────────────────── */

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardUp = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } } };

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white font-sans scroll-smooth overflow-hidden">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0B0F1A]/80 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span>Specwright</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-500 hover:text-white transition-colors hidden sm:block">How it works</a>
            <a href="#why" className="text-sm text-slate-500 hover:text-white transition-colors hidden sm:block">Why Specwright</a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500
                         text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20
                         hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: headline */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-6"
              >
                <Zap className="h-3 w-3" />
                Cursor for Product Management
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [.22, 1, .36, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.08] tracking-tight"
              >
                Your AI Agents Are Waiting for{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                  Clear Instructions
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg text-slate-400 mb-8 leading-relaxed"
              >
                Specwright transforms messy Slack threads, customer calls, and meeting notes into{' '}
                <span className="text-white font-medium">executable specifications</span>{' '}
                your AI coding agents can actually follow.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/demo"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500
                             text-white font-semibold rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98]
                             shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30"
                >
                  Generate Your First Spec
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/[0.08]
                             hover:border-white/20 text-slate-300 hover:text-white font-semibold rounded-xl transition-all"
                >
                  See how it works ↓
                </a>
              </motion.div>

              {/* Mini stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex gap-8"
              >
                {[
                  { value: '10x', label: 'Faster spec writing' },
                  { value: '90%', label: 'Fewer AI hallucinations' },
                  { value: '0', label: 'Context lost' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: before/after */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [.22, 1, .36, 1] }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl" />
              <div className="relative space-y-4">
                {/* BEFORE */}
                <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-500 font-medium">BEFORE — Slack thread</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs text-slate-400">
                    <p><span className="text-blue-400">@sarah:</span> can we add bulk delete for docs?</p>
                    <p><span className="text-green-400">@mike:</span> seems easy, maybe 3-4 days?</p>
                    <p><span className="text-blue-400">@sarah:</span> Ship it!</p>
                    <p className="text-slate-700 italic text-[10px] mt-2">…3 months of buried context, 1 security bug, $50k ARR at risk</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium"
                  >
                    <Zap className="h-3 w-3" />
                    Specwright
                  </motion.div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
                </div>

                {/* AFTER */}
                <div className="bg-[#111827] border border-emerald-500/20 rounded-xl p-5 shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-2 h-2 rounded-full bg-emerald-500"
                    />
                    <span className="text-xs text-emerald-400 font-medium">AFTER — Executable Spec (4 layers)</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: '01 Narrative:', color: 'text-emerald-400', text: 'Enable bulk-delete for enterprise cleanup' },
                      { label: '02 Evidence:', color: 'text-blue-400', text: 'Slack #product, Zendesk #4521, $50k ARR' },
                      { label: '03 Constraint:', color: 'text-red-400', text: 'DO NOT bypass permission checks on bulk ops' },
                      { label: '04 Gherkin:', color: 'text-purple-400', text: 'Given editor role / When bulk delete / Then only owned' },
                    ].map(layer => (
                      <div key={layer.label} className="flex gap-2">
                        <span className={`${layer.color} font-medium shrink-0`}>{layer.label}</span>
                        <span className="text-slate-300">{layer.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30"
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </section>

      {/* ── INTEGRATIONS ROW ─────────────────────────────────────────────────── */}
      <Section className="py-12 border-y border-white/[0.03]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.p variants={fadeIn} className="text-center text-xs text-slate-600 uppercase tracking-[0.2em] mb-6">
            Ingests from the tools you already use
          </motion.p>
          <motion.div variants={stagger} className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            {[
              { Icon: SlackIcon, name: 'Slack' },
              { Icon: JiraIcon, name: 'Jira' },
              { Icon: NotionIcon, name: 'Notion' },
              { Icon: GongIcon, name: 'Gong' },
              { Icon: ConfluenceIcon, name: 'Confluence' },
            ].map(({ Icon, name }) => (
              <motion.div
                key={name}
                variants={cardUp}
                whileHover={{ scale: 1.1, y: -2 }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center
                                group-hover:border-white/10 group-hover:bg-white/[0.06] transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">{name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────────── */}
      <Section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why your AI agents keep{' '}
              <span className="text-red-400">hallucinating requirements</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              The problem isn&apos;t your AI tools. It&apos;s the input you&apos;re feeding them.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5 mb-14">
            {[
              { icon: MessageSquare, color: 'amber', title: 'Scattered context', desc: "Requirements live in Slack, Jira, Notion, email, and engineers' heads. Your AI agent sees none of it." },
              { icon: FileText, color: 'orange', title: 'Vague specs', desc: 'Traditional AI spec tools generate documents, not executable intent. "Add dark mode" tells your agent nothing useful.' },
              { icon: X, color: 'red', title: 'No pre-code validation', desc: 'Bugs caught in code review cost 10x more than bugs caught in specs. Most teams catch them too late.' },
            ].map((item) => {
              const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
                orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/15' },
                red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
              };
              const c = colorMap[item.color];
              return (
                <motion.div
                  key={item.title}
                  variants={cardUp}
                  whileHover={{ y: -3 }}
                  className={`p-6 rounded-2xl border ${c.bg} ${c.border} hover:shadow-lg transition-all`}
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
                    <item.icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quotes */}
          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-4">
            {BETA_QUOTES.map((q) => (
              <motion.div
                key={q.author}
                variants={cardUp}
                whileHover={{ y: -2 }}
                className="bg-[#111827] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: q.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 italic">&ldquo;{q.quote}&rdquo;</p>
                <div>
                  <p className="text-white text-sm font-medium">{q.author}</p>
                  <p className="text-slate-600 text-xs">{q.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── THE SOLUTION ─────────────────────────────────────────────────────── */}
      <Section className="py-20 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The 4-layer{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Executable Spec
              </span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Not a document. Not a prompt. A structured, evidence-grounded instruction set
              that AI agents can implement without hallucinating.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-4 mb-12">
            {FOUR_LAYERS.map((layer) => {
              const colorMap: Record<string, { card: string; text: string }> = {
                emerald: { card: 'border-emerald-500/20 bg-emerald-500/[0.04]', text: 'text-emerald-400' },
                blue: { card: 'border-blue-500/20 bg-blue-500/[0.04]', text: 'text-blue-400' },
                red: { card: 'border-red-500/20 bg-red-500/[0.04]', text: 'text-red-400' },
                purple: { card: 'border-purple-500/20 bg-purple-500/[0.04]', text: 'text-purple-400' },
              };
              const c = colorMap[layer.color];
              return (
                <motion.div
                  key={layer.number}
                  variants={cardUp}
                  whileHover={{ y: -2 }}
                  className={`p-6 rounded-2xl border ${c.card} transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`text-2xl font-black ${c.text} opacity-50 font-mono`}>{layer.number}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{layer.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.text} border-current/20 opacity-70`}>
                          {layer.subtitle}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mb-3 leading-relaxed">{layer.description}</p>
                      <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-xs font-mono text-slate-500 italic">{layer.example}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Before/After */}
          <motion.div variants={fadeUp} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5 text-center">
              Before vs After — One Real Requirement
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-500/[0.04] border border-red-500/15 rounded-xl p-4">
                <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                  <X className="h-3 w-3" /> Raw requirement
                </p>
                <p className="text-sm text-slate-400 italic font-mono">&ldquo;Add bulk delete for documents&rdquo;</p>
                <p className="text-xs text-slate-700 mt-2">→ AI agent guesses, skips permission checks, ships bug</p>
              </div>
              <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" /> Executable Spec
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-slate-300">→ Enable bulk-delete for enterprise accounts</p>
                  <p className="text-blue-300">→ Source: Slack #product, Zendesk #4521</p>
                  <p className="text-red-300">→ DO NOT bypass RLS on bulk endpoints</p>
                  <p className="text-purple-300">→ Gherkin: Given editor / When bulk / Then owns</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── WORKFLOW ──────────────────────────────────────────────────────────── */}
      <Section id="how-it-works" className="py-20 border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-500 text-lg">Five steps from chaos to clarity — in minutes, not days.</p>
          </motion.div>

          <motion.div variants={stagger} className="space-y-3">
            {WORKFLOW_STEPS.map((step) => (
              <motion.div
                key={step.num}
                variants={cardUp}
                whileHover={{ x: 4 }}
                className="flex gap-4 items-start p-5 bg-[#111827] border border-white/[0.06]
                           rounded-2xl hover:border-emerald-500/20 transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 border border-emerald-500/15
                                rounded-xl flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                  <step.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-slate-700 font-mono">STEP {step.num}</span>
                    <h3 className="text-white font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── WHY SPECWRIGHT ──────────────────────────────────────────────────── */}
      <Section id="why" className="py-20 border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why teams choose{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Specwright</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Traditional spec tools generate documents. Specwright generates executable intent.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Target, title: 'Context → Spec', desc: 'Generate from real conversations, not blank prompts. Every requirement traces back to a real source.', color: 'emerald' },
              { icon: Shield, title: 'Pre-code simulation', desc: '4 validators catch ambiguity, contradictions, and permission gaps before a line of code is written.', color: 'blue' },
              { icon: Terminal, title: 'Native MCP integration', desc: 'Deliver specs directly to Cursor, Claude, or any AI coding tool. No copy-paste, no context lost.', color: 'purple' },
              { icon: Zap, title: 'Constraint extraction', desc: "Automatically surfaces tribal knowledge — the DO NOT rules that live only in engineers' heads.", color: 'amber' },
              { icon: CheckCircle, title: 'Gherkin test generation', desc: 'Auto-generate acceptance tests per scenario. Your AI agent can implement them directly.', color: 'cyan' },
              { icon: GitBranch, title: 'Evidence-grounded', desc: 'Every requirement is cited with [SOURCE-ID] links. No hallucinated requirements, no guesswork.', color: 'rose' },
            ].map((item) => {
              const cMap: Record<string, { bg: string; text: string; border: string }> = {
                emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15' },
                blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/15' },
                purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/15' },
                amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
                cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/15' },
                rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/15' },
              };
              const c = cMap[item.color];
              return (
                <motion.div
                  key={item.title}
                  variants={cardUp}
                  whileHover={{ y: -3 }}
                  className={`p-5 rounded-2xl border ${c.bg} ${c.border} transition-all`}
                >
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                    <item.icon className={`h-4 w-4 ${c.text}`} />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{item.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <Section className="py-24 border-t border-white/[0.03]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to stop hallucinating requirements?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">
            Join teams shipping better features, faster — with specs their AI agents can actually follow.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/demo"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500
                         text-white font-semibold rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98]
                         shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 text-base"
            >
              Generate Your First Spec
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/[0.08]
                         hover:border-emerald-500/30 text-slate-300 hover:text-white font-semibold rounded-xl transition-all text-base"
            >
              <Terminal className="h-4 w-4" />
              See the MCP integration
            </Link>
          </motion.div>

          <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-6 text-xs text-slate-600">
            {['No credit card required', 'Free to try', 'Real AI output', 'MCP-ready for Cursor'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Layers className="h-3 w-3 text-white" />
              </div>
              <span>Specwright</span>
              <span className="text-slate-700 text-sm font-normal ml-1">— Executable specs for AI coding agents</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
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
            <p className="text-slate-700 text-xs">© 2025 Specwright. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
