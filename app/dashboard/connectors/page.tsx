'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, RefreshCw, Plug, CheckCircle, AlertCircle,
    Layers, Unplug
} from 'lucide-react';
import { CONNECTOR_REGISTRY, ConnectorMeta } from '@/lib/connectors/types';
import ConnectorSetupModal from '@/components/ConnectorSetupModal';

interface SavedConnector {
    id: number;
    type: string;
    name: string;
    status: string;
    last_sync_at: string | null;
    items_synced: number;
}

export default function ConnectorsPage() {
    const [saved, setSaved] = useState<SavedConnector[]>([]);
    const [loading, setLoading] = useState(true);
    const [setupConnector, setSetupConnector] = useState<ConnectorMeta | null>(null);
    const [syncingId, setSyncingId] = useState<number | null>(null);

    async function loadConnectors() {
        try {
            const res = await fetch('/api/connectors');
            const data = await res.json();
            setSaved(data.connectors ?? []);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadConnectors(); }, []);

    const handleSync = async (connectorId: number) => {
        setSyncingId(connectorId);
        try {
            await fetch(`/api/connectors/${connectorId}/sync`, { method: 'POST' });
            await loadConnectors();
        } catch {
            /* silent */
        } finally {
            setSyncingId(null);
        }
    };

    const handleDelete = async (connectorId: number) => {
        try {
            await fetch('/api/connectors', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: connectorId }),
            });
            await loadConnectors();
        } catch {
            /* silent */
        }
    };

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {setupConnector && (
                <ConnectorSetupModal
                    connector={setupConnector}
                    onClose={() => setSetupConnector(null)}
                    onSaved={loadConnectors}
                />
            )}

            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">Dashboard</span>
                        </Link>
                        <span className="text-slate-700">/</span>
                        <div className="flex items-center gap-2">
                            <Plug className="h-4 w-4 text-emerald-400" />
                            <span className="text-slate-300 text-sm font-medium">Connectors</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Description */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Data Source Connectors</h1>
                    <p className="text-slate-400 text-sm">
                        Connect your team&apos;s tools to automatically import context for spec generation.
                        Synced data becomes available as context when generating executable specifications.
                    </p>
                </div>

                {/* Connected connectors */}
                {saved.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                            Connected ({saved.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {saved.map(conn => {
                                const meta = CONNECTOR_REGISTRY.find(c => c.type === conn.type);
                                const isSyncing = syncingId === conn.id;
                                return (
                                    <div
                                        key={conn.id}
                                        className="p-5 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-slate-600 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{meta?.icon ?? '🔗'}</span>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{conn.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        {conn.status === 'connected' ? (
                                                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                                                        ) : conn.status === 'error' ? (
                                                            <AlertCircle className="h-3 w-3 text-red-400" />
                                                        ) : (
                                                            <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                                                        )}
                                                        <span className={`text-xs ${conn.status === 'connected' ? 'text-emerald-400' :
                                                                conn.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                                            }`}>
                                                            {conn.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                            <span>{conn.items_synced ?? 0} items synced</span>
                                            {conn.last_sync_at && (
                                                <span>Last: {new Date(conn.last_sync_at).toLocaleDateString()}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSync(conn.id)}
                                                disabled={isSyncing}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-600
                                   hover:border-emerald-500 text-slate-300 hover:text-emerald-400
                                   disabled:opacity-40 rounded-lg text-xs transition-all"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                                {isSyncing ? 'Syncing…' : 'Sync Now'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(conn.id)}
                                                className="px-3 py-2 border border-slate-700 hover:border-red-500
                                   text-slate-500 hover:text-red-400 rounded-lg text-xs transition-all"
                                            >
                                                <Unplug className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Available connectors */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Available Connectors
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CONNECTOR_REGISTRY.map(conn => {
                            const isConnected = saved.some(s => s.type === conn.type);
                            const colors = colorMap[conn.color] ?? colorMap.slate;

                            return (
                                <div
                                    key={conn.type}
                                    className={`p-5 bg-slate-800/40 border rounded-xl transition-all ${isConnected
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                                            <span className="text-xl">{conn.icon}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{conn.name}</p>
                                            <p className="text-xs text-slate-400">{conn.description}</p>
                                        </div>
                                    </div>

                                    {isConnected ? (
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            <span>Connected</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSetupConnector(conn)}
                                            className={`w-full mt-2 px-4 py-2.5 border ${colors.border} ${colors.text}
                                  hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-all
                                  flex items-center justify-center gap-2`}
                                        >
                                            <Plug className="h-3.5 w-3.5" />
                                            Connect
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
