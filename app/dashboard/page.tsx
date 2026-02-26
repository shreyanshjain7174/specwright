'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Database, FileText, MessageSquare,
  Loader2, Upload, X, Layers
} from 'lucide-react';
import { FeatureList, FeatureItem } from '@/components/feature-list';
import { useRouter } from 'next/navigation';

// Import modal
function ImportModal({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    // Simulate import (placeholder — real implementation would POST to API)
    await new Promise((r) => setTimeout(r, 1500));
    setDone(true);
    setLoading(false);
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Bulk Import</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Paste CSV or JSON. Each row/object should have <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">name</code> and optional <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">description</code> fields.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={`CSV example:\nname,description\nDark Mode,User-facing theme toggle\nBulk Delete,Delete multiple items at once\n\nJSON example:\n[{"name":"Dark Mode","description":"Theme toggle"}]`}
          rows={8}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white
                     placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-mono"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!raw.trim() || loading || done}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                       disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {done ? '✓ Imported!' : loading ? 'Importing…' : 'Import Features'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create feature modal
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleCreate}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Create Feature</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
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
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                         text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500
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
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                         text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500
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
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                       disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {creating ? 'Creating…' : 'Create Feature'}
          </button>
        </div>
      </form>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {showCreate && (
        <CreateFeatureModal
          onClose={() => setShowCreate(false)}
          onCreated={loadFeatures}
        />
      )}
      {showImport && <ImportModal onClose={() => { setShowImport(false); loadFeatures(); }} />}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Layers className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white hidden sm:inline">Specwright</span>
            </Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="text-slate-300 text-sm font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/ingest"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-700
                         hover:border-slate-600 text-slate-400 hover:text-white text-sm
                         font-medium rounded-lg transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Ingest Context</span>
            </Link>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-700
                         hover:border-slate-600 text-slate-400 hover:text-white text-sm
                         font-medium rounded-lg transition-all"
              aria-label="Bulk import features"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500
                         text-white text-sm font-semibold rounded-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">New Feature</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Database, label: 'Features', value: features.length, color: 'emerald' },
            { icon: MessageSquare, label: 'Raw Inputs', value: totalInputs, color: 'blue' },
            { icon: FileText, label: 'Specs Generated', value: totalSpecs, color: 'purple' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 sm:p-5 bg-slate-800/40 border border-slate-700 rounded-xl flex items-center gap-3 sm:gap-4"
            >
              <div className={`p-2.5 rounded-lg bg-${stat.color}-500/10 flex-shrink-0`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-400`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature list */}
        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
            <Loader2 className="h-6 w-6 text-slate-500 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading features…</span>
          </div>
        ) : (
          <FeatureList
            features={features}
            onCreateClick={() => setShowCreate(true)}
            onAddContext={handleAddContext}
          />
        )}
      </main>
    </div>
  );
}
