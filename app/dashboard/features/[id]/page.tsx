'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    FileText,
    MessageSquare,
    Clock,
    Loader2,
    Sparkles,
    Database,
} from 'lucide-react';

interface FeatureDetail {
    feature: {
        id: string;
        name: string;
        description: string;
    };
    specifications: Array<{
        id: string;
        details: string;
        createdAt: string;
    }>;
    rawInputs: Array<{
        id: string;
        source: string;
        content: string;
        createdAt: string;
    }>;
    traceability: {
        totalRawInputs: number;
        totalSpecs: number;
        sources: string[];
    };
}

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<FeatureDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/specs/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ featureName: id }),
                });
                const json = await res.json();
                if (res.ok) {
                    setData(json.spec);
                } else {
                    setError(json.error || 'Failed to load feature');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
                <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                    </div>
                </header>
                <div className="max-w-6xl mx-auto px-4 py-20 text-center">
                    <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">{error || 'Feature not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
            <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-100">{data.feature.name}</h1>
                            {data.feature.description && (
                                <p className="text-sm text-gray-500">{data.feature.description}</p>
                            )}
                        </div>
                    </div>
                    <Link
                        href="/dashboard/ingest"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                       text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        <Sparkles className="h-4 w-4" />
                        Add Context
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
                        <p className="text-2xl font-bold text-white">{data.traceability.totalRawInputs}</p>
                        <p className="text-xs text-gray-500">Raw Inputs</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
                        <p className="text-2xl font-bold text-white">{data.traceability.totalSpecs}</p>
                        <p className="text-xs text-gray-500">Specifications</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
                        <p className="text-2xl font-bold text-white">{data.traceability.sources.length}</p>
                        <p className="text-xs text-gray-500">Sources</p>
                    </div>
                </div>

                {/* Raw Inputs */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        Raw Inputs ({data.rawInputs.length})
                    </h2>
                    {data.rawInputs.length === 0 ? (
                        <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No raw inputs yet. Start by ingesting context.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.rawInputs.map((input) => (
                                <div
                                    key={input.id}
                                    className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full font-medium">
                                            {input.source}
                                        </span>
                                        <span className="text-xs text-gray-600 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(input.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                        {input.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Specs */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-400" />
                        Specifications ({data.specifications.length})
                    </h2>
                    {data.specifications.length === 0 ? (
                        <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                            <p className="text-gray-500">
                                No specs generated yet. Use the MCP server or Demo page to generate specs.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.specifications.map((spec) => (
                                <div
                                    key={spec.id}
                                    className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl"
                                >
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{spec.details}</p>
                                    <p className="text-xs text-gray-600 mt-2">
                                        {new Date(spec.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
