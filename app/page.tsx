import Link from 'next/link';
import { ArrowRight, Zap, Shield, GitBranch, CheckCircle, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            Cursor for Product Management
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Chaos into{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Executable Specifications
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            AI coding tools made writing code nearly free. The bottleneck shifted to defining what to build.
            We synthesize scattered context into specs that AI agents can implement without hallucinating.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 
                         text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Try the Demo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 border border-gray-600 hover:border-gray-400
                         text-gray-300 font-semibold rounded-xl transition-all hover:scale-105"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
            {[
              { value: '10x', label: 'Faster Specs' },
              { value: '90%', label: 'Fewer Hallucinations' },
              { value: '$0', label: 'Context Lost' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-4">The Problem We Solve</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Context is scattered. AI agents hallucinate. Features ship broken.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="p-6 rounded-2xl border-2 border-red-500/30 bg-red-500/5">
              <h3 className="text-xl font-semibold text-red-400 mb-4">❌ Without Reasoning Engine</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Context scattered across Slack, Jira, Notion, GitHub
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Critical constraints buried in old threads
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  "Simple" features become week-long emergencies
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  AI agents hallucinate features that "work" but are wrong
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="p-6 rounded-2xl border-2 border-green-500/30 bg-green-500/5">
              <h3 className="text-xl font-semibold text-green-400 mb-4">✅ With Reasoning Engine</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  AI synthesizes context into Executable Specifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  Constraints extracted and enforced automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  Pre-code simulation catches bugs BEFORE implementation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  Export specs directly to Cursor, Claude, or any AI tool
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-4">How It Works</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Four layers that transform chaos into machine-readable truth
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Context Intelligence',
                description: 'RAG-powered synthesis from all your tools into unified context',
                color: 'blue'
              },
              {
                icon: Shield,
                title: 'Constraint Layer',
                description: 'Explicit DO NOT rules extracted from buried tribal knowledge',
                color: 'red'
              },
              {
                icon: GitBranch,
                title: 'Pre-Code Simulation',
                description: 'Virtual user testing catches ambiguities before coding starts',
                color: 'purple'
              },
              {
                icon: CheckCircle,
                title: 'Gherkin Verification',
                description: 'Automated test scenarios AI agents can implement directly',
                color: 'green'
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
                <feature.icon className={`h-10 w-10 text-${feature.color}-400 mb-4`} />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-y border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop Shipping Hallucinated Features
          </h2>
          <p className="text-gray-400 mb-8">
            See how we caught a $220K bug in 3 seconds with pre-code simulation
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 
                       text-gray-900 font-semibold rounded-xl transition-colors"
          >
            Try the Live Demo
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Built by Shreyansh • The Reasoning Engine © 2026</p>
        </div>
      </footer>
    </div>
  );
}
