'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Database, FileText, MessageSquare,
  Loader2, Upload, X, Layers, Plug, TrendingUp
} from 'lucide-react';
import { FeatureList, FeatureItem } from '@/components/feature-list';
import { useRouter } from 'next/navigation';

/* ─── Animation helpers ───────────────────────────────────────────────────────── */

const cardUp = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Import Modal ────────────────────────────────────────────────────────────── */

function ImportModal({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setDone(true);
    setLoading(false);
    setTimeout(onClose, 1000);
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
        {/* Gradient header strip */}
        <div className="h-1 -mt-6 -mx-6 mb-5 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Upload className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Bulk Import</h2>
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
        <p className="text-sm text-slate-400 mb-4">
          Paste CSV or JSON. Each row/object should have <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">name</code> and optional <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">description</code> fields.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={`CSV example:\nname,description\nDark Mode,User-facing theme toggle\nBulk Delete,Delete multiple items at once`}
          rows={8}
          className="w-full px-4 py-3 bg-black/20 border border-white/[0.06] rounded-xl text-sm text-white
                     placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none font-mono
                     transition-colors"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleImport}
            disabled={!raw.trim() || loading || done}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                       disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {done ? '✓ Imported!' : loading ? 'Importing…' : 'Import Features'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Create Feature Modal ────────────────────────────────────────────────────── */

function CreateFeatureModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc }),
      });
      onCreated();
      onClose();
    } catch {
      // silently fail for now
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring' as const, stiffness: 350, damping: 30 }}
        onSubmit={handleCreate}
        className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        {/* Gradient header strip */}
        <div className="h-1 -mt-6 -mx-6 mb-5 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Create Feature</h2>
          <motion.button
            type="button"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="feature-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Feature Name <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="feature-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Mode, Bulk Delete, SSO"
              className="w-full px-4 py-2.5 bg-black/20 border border-white/[0.06] rounded-lg
                         text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50
                         transition-colors text-sm"
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="feature-desc" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="feature-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of what this feature should do…"
              rows={3}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/[0.06] rounded-lg
                         text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50
                         transition-colors resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={creating || !name.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                       disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {creating ? 'Creating…' : 'Create Feature'}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ─── Dashboard Page ──────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function loadFeatures() {
    try {
      const res = await fetch('/api/features');
      const data = await res.json();
      setFeatures(data.features || []);
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleAddContext = (featureId: string) => {
    router.push(`/dashboard/ingest?featureId=${featureId}`);
  };

  const totalInputs = features.reduce((s, f) => s + Number(f.raw_input_count || 0), 0);
  const totalSpecs = features.reduce((s, f) => s + Number(f.spec_count || 0), 0);

  const stats = [
    { icon: Database, label: 'Features', value: features.length, color: 'emerald' },
    { icon: MessageSquare, label: 'Raw Inputs', value: totalInputs, color: 'blue' },
    { icon: FileText, label: 'Specs Generated', value: totalSpecs, color: 'purple' },
  ];

  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'group-hover:shadow-emerald-500/10' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'group-hover:shadow-blue-500/10' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'group-hover:shadow-purple-500/10' },
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateFeatureModal
            onClose={() => setShowCreate(false)}
            onCreated={loadFeatures}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showImport && <ImportModal onClose={() => { setShowImport(false); loadFeatures(); }} />}
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
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Layers className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white hidden sm:inline">Specwright</span>
            </Link>
            <span className="text-white/10" aria-hidden="true">/</span>
            <span className="text-slate-300 text-sm font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {[
              { href: '/dashboard/connectors', icon: Plug, label: 'Connectors' },
              { href: '/dashboard/ingest', icon: MessageSquare, label: 'Ingest Context' },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/[0.06]
                           hover:border-white/10 text-slate-400 hover:text-white text-sm
                           font-medium rounded-lg transition-all"
              >
                <nav.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{nav.label}</span>
              </Link>
            ))}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/[0.06]
                         hover:border-white/10 text-slate-400 hover:text-white text-sm
                         font-medium rounded-lg transition-all"
              aria-label="Bulk import features"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Import</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500
                         text-white text-sm font-semibold rounded-lg transition-all
                         shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">New Feature</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {stats.map((stat) => {
            const c = colorMap[stat.color];
            return (
              <motion.div
                key={stat.label}
                variants={cardUp}
                whileHover={{ y: -2 }}
                className={`group p-5 bg-[#111827] border border-white/[0.06] rounded-2xl
                            flex items-center gap-4 hover:border-white/10
                            transition-all hover:shadow-lg ${c.glow}`}
              >
                <div className={`p-2.5 rounded-xl ${c.bg} flex-shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${c.text}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-600">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
              <Loader2 className="h-6 w-6 text-slate-600 animate-spin" aria-hidden="true" />
              <span className="sr-only">Loading features…</span>
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">No features yet</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Create your first feature to start generating executable specs.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500
                           text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" />
                Create Feature
              </motion.button>
            </div>
          ) : (
            <FeatureList
              features={features}
              onCreateClick={() => setShowCreate(true)}
              onAddContext={handleAddContext}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
