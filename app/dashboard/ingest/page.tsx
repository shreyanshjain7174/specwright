'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Feature {
    id: string;
    name: string;
}

export default function IngestPage() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [selectedFeature, setSelectedFeature] = useState('');
    const [source, setSource] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        async function loadFeatures() {
            try {
                const res = await fetch('/api/features');
                const data = await res.json();
                setFeatures(data.features || []);
            } catch (err) {
                console.error('Failed to load features:', err);
            }
        }
        loadFeatures();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!source.trim() || !content.trim() || !selectedFeature) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/context/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    content,
                    linkedFeatureId: selectedFeature,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: `Context ingested! ID: ${data.id}` });
                setContent('');
            } else {
                setResult({ success: false, message: data.error || 'Ingestion failed' });
            }
        } catch (err) {
            setResult({ success: false, message: 'Network error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
            <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-100">Ingest Context</h1>
                        <p className="text-sm text-gray-500">
                            Add raw inputs from Slack, user calls, etc.
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Result Banner */}
                {result && (
                    <div
                        className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${result.success
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}
                    >
                        {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        )}
                        <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                            {result.message}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Feature Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Link to Feature
                        </label>
                        <select
                            value={selectedFeature}
                            onChange={(e) => setSelectedFeature(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="">Select a feature...</option>
                            {features.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Source
                        </label>
                        <input
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="e.g. Slack #product-feedback, User Call, Zendesk"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Raw Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste the raw text from the source..."
                            rows={10}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                         resize-none font-mono text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !source.trim() || !content.trim() || !selectedFeature}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500
                       disabled:bg-gray-700 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg transition-colors w-full justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Ingesting...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Ingest Context
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
