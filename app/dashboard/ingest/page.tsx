'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { ContextChunksPreview, previewChunks, ContentChunk } from '@/components/context-chunks-preview';

interface Feature {
  id: string;
  name: string;
}

const SOURCE_OPTIONS = [
  { value: 'slack', label: '💬 Slack', description: 'Channel messages, threads, DMs' },
  { value: 'jira', label: '🎫 Jira', description: 'Tickets, comments, descriptions' },
  { value: 'notion', label: '📝 Notion', description: 'Pages, databases, comments' },
  { value: 'transcript', label: '🎙️ Transcript', description: 'Call recordings, meeting notes' },
  { value: 'zendesk', label: '🎧 Zendesk', description: 'Support tickets, customer feedback' },
  { value: 'github', label: '⚙️ GitHub', description: 'Issues, PRs, discussions' },
  { value: 'manual', label: '✏️ Manual', description: 'Brain dump, general notes' },
];

const STEPS = [
  { id: 1, label: 'Select Feature' },
  { id: 2, label: 'Select Source' },
  { id: 3, label: 'Paste Content' },
  { id: 4, label: 'Preview Chunks' },
  { id: 5, label: 'Confirm' },
];

type Result = { success: boolean; message: string; chunkCount?: number };

// Inner component that uses useSearchParams (must be inside Suspense)
function IngestForm() {
  const searchParams = useSearchParams();
  const preselectedFeatureId = searchParams?.get('featureId') || '';

  const [features, setFeatures] = useState<Feature[]>([]);
  const [step, setStep] = useState(1);
  const [featureId, setFeatureId] = useState(preselectedFeatureId);
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [chunks, setChunks] = useState<ContentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    async function loadFeatures() {
      try {
        const res = await fetch('/api/features');
        const data = await res.json();
        setFeatures(data.features || []);
      } catch {}
    }
    loadFeatures();
  }, []);

  useEffect(() => {
    if (preselectedFeatureId) {
      setFeatureId(preselectedFeatureId);
      setStep((s) => (s === 1 ? 2 : s));
    }
  }, [preselectedFeatureId]);

  const canNext = () => {
    if (step === 1) return !!featureId;
    if (step === 2) return !!source;
    if (step === 3) return content.trim().length > 20;
    if (step === 4) return chunks.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      const preview = previewChunks(content);
      setChunks(preview);
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setEmbedding(true);
    setResult(null);

    for (let i = 0; i < chunks.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setChunks((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, embedding: 'done' as const } : c))
      );
    }
    setEmbedding(false);

    try {
      const res = await fetch('/api/context/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, content, linkedFeatureId: featureId }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: 'Context ingested successfully!', chunkCount: chunks.length });
      } else {
        setResult({ success: false, message: data.error || 'Ingestion failed' });
      }
    } catch {
      setResult({ success: false, message: 'Network error — please try again' });
    } finally {
      setLoading(false);
    }
  };

  const selectedFeature = features.find((f) => f.id === featureId);
  const selectedSource = SOURCE_OPTIONS.find((s) => s.value === source);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  if (result?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-5">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Context Ingested!</h2>
        <p className="text-slate-400 mb-2">
          {result.chunkCount} semantic chunk{result.chunkCount !== 1 ? 's' : ''} embedded and indexed.
        </p>
        <p className="text-xs text-slate-600 mb-8">
          Source: {selectedSource?.label} → Feature: {selectedFeature?.name}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={selectedFeature ? `/dashboard/features/${featureId}` : '/dashboard'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600
                       hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            View Feature
          </Link>
          <button
            onClick={() => { setStep(1); setContent(''); setSource(''); setChunks([]); setResult(null); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-700
                       text-slate-300 hover:text-white hover:border-slate-600 font-medium rounded-lg transition-colors"
          >
            Ingest More
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Step progress */}
      <nav aria-label="Ingestion steps" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done ? 'bg-emerald-500 border-emerald-500 text-white'
                      : active ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-slate-700 text-slate-600'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? '✓' : s.id}
                  </div>
                  <span className={`text-[10px] mt-1 text-center hidden sm:block ${
                    active ? 'text-emerald-400' : done ? 'text-slate-400' : 'text-slate-600'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Error banner */}
      {result && !result.success && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-5" role="alert">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{result.message}</p>
        </div>
      )}

      {/* Step content */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 sm:p-6 min-h-80">
        {/* Step 1: Select feature */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Select a Feature</h2>
            <p className="text-sm text-slate-400 mb-5">Which feature does this context belong to?</p>
            {features.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-3">No features yet.</p>
                <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 text-sm underline transition-colors">
                  Create a feature first →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFeatureId(f.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      featureId === f.id
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : 'border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white'
                    }`}
                    aria-pressed={featureId === f.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                        featureId === f.id ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
                      }`} aria-hidden="true" />
                      <span className="font-medium text-sm">{f.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select source */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Select Source Type</h2>
            <p className="text-sm text-slate-400 mb-5">Where is this context from?</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSource(opt.value)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    source === opt.value
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  aria-pressed={source === opt.value}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                      source === opt.value ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
                    }`} aria-hidden="true" />
                    <span className="font-medium text-white text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Paste content */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Paste Content</h2>
            <p className="text-sm text-slate-400 mb-4">
              From <span className="text-white">{selectedSource?.label}</span> for{' '}
              <span className="text-emerald-400">{selectedFeature?.name}</span>. Best with 100–200 words.
            </p>
            <div className="relative">
              <label htmlFor="content-paste" className="sr-only">Context content</label>
              <textarea
                id="content-paste"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste the raw ${selectedSource?.label || 'content'} here…\n\nInclude as much relevant context as possible.`}
                rows={12}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white
                           placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors
                           resize-none font-mono"
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-600">
                {wordCount} words
                {wordCount > 0 && wordCount < 50 && <span className="text-yellow-500 ml-2">— add more</span>}
                {wordCount >= 50 && wordCount <= 300 && <span className="text-emerald-500 ml-2">— ideal</span>}
                {wordCount > 300 && <span className="text-slate-400 ml-2">— will chunk</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview chunks */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Preview Semantic Chunks</h2>
            <p className="text-sm text-slate-400 mb-4">
              Your content will be split into these chunks for embedding and RAG retrieval.
            </p>
            <ContextChunksPreview chunks={chunks} />
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Confirm Ingestion</h2>
            <p className="text-sm text-slate-400 mb-5">Review your submission before ingesting.</p>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Feature', value: selectedFeature?.name || '—' },
                { label: 'Source', value: selectedSource?.label || '—' },
                { label: 'Content size', value: `${wordCount} words → ${chunks.length} chunks` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
            {loading ? (
              <div className="space-y-4">
                <ContextChunksPreview chunks={chunks} isEmbedding={embedding} />
                <div className="flex items-center justify-center gap-3 text-slate-400 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Embedding and indexing chunks…
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600
                           hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all"
              >
                <Send className="h-4 w-4" />
                Ingest {chunks.length} Chunk{chunks.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {!loading && !result && (
        <div className="flex justify-between mt-5">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-700
                       hover:border-slate-600 text-slate-400 hover:text-white text-sm font-medium
                       rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {step < 5 && (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500
                         disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold
                         text-sm rounded-lg transition-all"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function IngestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-slate-700" aria-hidden="true">/</span>
          <div>
            <h1 className="text-base font-bold text-white">Ingest Context</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Feed raw inputs to the knowledge graph</p>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20" role="status">
            <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
            <span className="sr-only">Loading…</span>
          </div>
        }>
          <IngestForm />
        </Suspense>
      </main>
    </div>
  );
}
