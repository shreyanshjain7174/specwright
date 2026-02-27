'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Loader2, RefreshCw, Plug, CheckCircle, AlertCircle,
    Unplug, Sparkles, Zap
} from 'lucide-react';
import { CONNECTOR_REGISTRY, ConnectorMeta } from '@/lib/connectors/types';
import { CONNECTOR_ICONS } from '@/components/icons/ConnectorIcons';
import ConnectorSetupModal from '@/components/ConnectorSetupModal';

interface SavedConnector {
    id: number;
    type: string;
    name: string;
    status: string;
    last_sync_at: string | null;
    items_synced: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.95 },
    show: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 24 },
    },
};

const pulseKeyframes = {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
};

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

    const gradient: Record<string, string> = {
        purple: 'from-purple-500/20 via-purple-600/10 to-transparent',
        blue: 'from-blue-500/20 via-blue-600/10 to-transparent',
        slate: 'from-slate-400/20 via-slate-500/10 to-transparent',
        amber: 'from-amber-500/20 via-amber-600/10 to-transparent',
        cyan: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    };

    const glowColor: Record<string, string> = {
        purple: 'group-hover:shadow-purple-500/20',
        blue: 'group-hover:shadow-blue-500/20',
        slate: 'group-hover:shadow-slate-400/20',
        amber: 'group-hover:shadow-amber-500/20',
        cyan: 'group-hover:shadow-cyan-500/20',
    };

    const borderHover: Record<string, string> = {
        purple: 'group-hover:border-purple-500/40',
        blue: 'group-hover:border-blue-500/40',
        slate: 'group-hover:border-slate-500/40',
        amber: 'group-hover:border-amber-500/40',
        cyan: 'group-hover:border-cyan-500/40',
    };

    const accentText: Record<string, string> = {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        slate: 'text-slate-300',
        amber: 'text-amber-400',
        cyan: 'text-cyan-400',
    };

    const btnBorder: Record<string, string> = {
        purple: 'border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/10',
        blue: 'border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/10',
        slate: 'border-slate-500/30 hover:border-slate-400/60 hover:bg-slate-500/10',
        amber: 'border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/10',
        cyan: 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/10',
    };

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white overflow-hidden">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <AnimatePresence>
                {setupConnector && (
                    <ConnectorSetupModal
                        connector={setupConnector}
                        onClose={() => setSetupConnector(null)}
                        onSaved={loadConnectors}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-40"
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">Dashboard</span>
                        </Link>
                        <span className="text-slate-800">/</span>
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-emerald-500/10">
                                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                            <span className="text-white text-sm font-medium">Connectors</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Sparkles className="h-3 w-3" />
                        <span>{saved.length} connected</span>
                    </div>
                </div>
            </motion.header>

            <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
                {/* Hero section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-3">
                        Data Source Connectors
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
                        Connect your team&apos;s tools to automatically import context for spec generation.
                        Synced data flows directly into Specwright as raw context — no copy-paste needed.
                    </p>
                </motion.div>

                {/* Connected connectors */}
                {saved.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-14"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
                            <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-[0.2em]">
                                Active Connections
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/30 to-transparent" />
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {saved.map(conn => {
                                const meta = CONNECTOR_REGISTRY.find(c => c.type === conn.type);
                                const IconComponent = CONNECTOR_ICONS[conn.type];
                                const isSyncing = syncingId === conn.id;
                                return (
                                    <motion.div
                                        key={conn.id}
                                        variants={cardVariants}
                                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                        className="group relative p-5 rounded-2xl border border-emerald-500/20
                               bg-gradient-to-br from-emerald-500/5 via-[#0F1420] to-[#0F1420]
                               hover:shadow-lg hover:shadow-emerald-500/10 transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center border border-emerald-500/10">
                                                    {IconComponent && <IconComponent className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{conn.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <motion.div
                                                            animate={conn.status === 'syncing' ? pulseKeyframes : {}}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                            className={`w-1.5 h-1.5 rounded-full ${conn.status === 'connected' ? 'bg-emerald-400' :
                                                                    conn.status === 'error' ? 'bg-red-400' : 'bg-amber-400'
                                                                }`}
                                                        />
                                                        <span className={`text-[11px] capitalize ${conn.status === 'connected' ? 'text-emerald-400' :
                                                                conn.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                                            }`}>
                                                            {conn.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-[11px] text-slate-600 mb-4">
                                            <span>{conn.items_synced ?? 0} items</span>
                                            {conn.last_sync_at && (
                                                <span>Synced {new Date(conn.last_sync_at).toLocaleDateString()}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSync(conn.id)}
                                                disabled={isSyncing}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                                   border border-emerald-500/20 hover:border-emerald-400/40
                                   text-slate-400 hover:text-emerald-400
                                   disabled:opacity-40 rounded-xl text-xs transition-all"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                                {isSyncing ? 'Syncing…' : 'Sync'}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDelete(conn.id)}
                                                className="px-3 py-2 border border-white/5 hover:border-red-500/30
                                   text-slate-600 hover:text-red-400 rounded-xl text-xs transition-all"
                                            >
                                                <Unplug className="h-3 w-3" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </motion.section>
                )}

                {/* Available connectors */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                            Available Connectors
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-slate-700/50 to-transparent" />
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {CONNECTOR_REGISTRY.map(conn => {
                            const isConnected = saved.some(s => s.type === conn.type);
                            const IconComponent = CONNECTOR_ICONS[conn.type];
                            const grad = gradient[conn.color] ?? gradient.slate;
                            const glow = glowColor[conn.color] ?? glowColor.slate;
                            const bHover = borderHover[conn.color] ?? borderHover.slate;
                            const accent = accentText[conn.color] ?? accentText.slate;
                            const btn = btnBorder[conn.color] ?? btnBorder.slate;

                            return (
                                <motion.div
                                    key={conn.type}
                                    variants={cardVariants}
                                    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                                    className={`group relative rounded-2xl border transition-all duration-300
                    ${isConnected
                                            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-[#0F1420]'
                                            : `border-white/[0.06] bg-[#0F1420] hover:shadow-xl ${glow} ${bHover}`
                                        }`}
                                >
                                    {/* Card glow overlay */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    <div className="relative p-6">
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad.replace('to-transparent', 'to-white/[0.02]')}
                                       border border-white/[0.06] flex items-center justify-center
                                       group-hover:scale-110 transition-transform duration-300`}>
                                                {IconComponent && <IconComponent className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-white text-[15px]">{conn.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{conn.description}</p>
                                            </div>
                                        </div>

                                        {isConnected ? (
                                            <div className="flex items-center gap-2 text-xs">
                                                <motion.div
                                                    animate={pulseKeyframes}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="w-2 h-2 rounded-full bg-emerald-400"
                                                />
                                                <span className="text-emerald-400 font-medium">Connected</span>
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSetupConnector(conn)}
                                                className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium
                                    transition-all duration-200 flex items-center justify-center gap-2
                                    ${btn} ${accent}`}
                                            >
                                                <Plug className="h-3.5 w-3.5" />
                                                Connect
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.section>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-[11px] text-slate-700 mt-16"
                >
                    Connector credentials are stored securely in your Neon database. Data synced from connectors is
                    available as context when generating executable specifications.
                </motion.p>
            </main>
        </div>
    );
}
