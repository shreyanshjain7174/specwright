'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Database,
    FileText,
    MessageSquare,
    Loader2,
    ExternalLink,
    ChevronRight,
} from 'lucide-react';

interface Feature {
    id: string;
    name: string;
    description: string;
    raw_input_count: number;
    spec_count: number;
    created_at: string;
    updated_at: string;
}

export default function DashboardPage() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);

    async function loadFeatures() {
        try {
            const res = await fetch('/api/features');
            const data = await res.json();
            setFeatures(data.features || []);
        } catch (err) {
            console.error('Failed to load features:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFeatures();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await fetch('/api/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, description: newDesc }),
            });
            setNewName('');
            setNewDesc('');
            setShowCreate(false);
            await loadFeatures();
        } catch (err) {
            console.error('Failed to create feature:', err);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Home
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-100">Dashboard</h1>
                            <p className="text-sm text-gray-500">Manage features and context</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/ingest"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600
                         hover:border-gray-500 hover:bg-gray-800
                         text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Ingest Context
                        </Link>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                         text-white font-medium rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Feature
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Create Feature Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <form
                            onSubmit={handleCreate}
                            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Create Feature</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Feature Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Dark Mode, Bulk Delete"
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                               text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                                    <textarea
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Brief description of this feature..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                               text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newName.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
                             disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        {
                            icon: Database,
                            label: 'Features',
                            value: features.length,
                            color: 'blue',
                        },
                        {
                            icon: MessageSquare,
                            label: 'Total Raw Inputs',
                            value: features.reduce((sum, f) => sum + Number(f.raw_input_count || 0), 0),
                            color: 'purple',
                        },
                        {
                            icon: FileText,
                            label: 'Total Specs',
                            value: features.reduce((sum, f) => sum + Number(f.spec_count || 0), 0),
                            color: 'green',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl flex items-center gap-4"
                        >
                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                                <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Features Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
                    </div>
                ) : features.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
                        <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No features yet</h3>
                        <p className="text-gray-500 mb-6">Create a feature to start ingesting context</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                         text-white font-medium rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create your first feature
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {features.map((feature) => (
                            <Link
                                key={feature.id}
                                href={`/dashboard/features/${feature.id}`}
                                className="group p-5 bg-gray-900/50 border border-gray-800 rounded-xl
                           hover:border-gray-600 transition-all flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {feature.name}
                                        </h3>
                                    </div>
                                    {feature.description && (
                                        <p className="text-sm text-gray-500 mb-2">{feature.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" />
                                            {feature.raw_input_count} inputs
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {feature.spec_count} specs
                                        </span>
                                        <span>
                                            Updated{' '}
                                            {new Date(feature.updated_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
