'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectorMeta, ConnectorField } from '@/lib/connectors/types';
import { CONNECTOR_ICONS } from '@/components/icons/ConnectorIcons';
import { X, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface Props {
    connector: ConnectorMeta;
    onClose: () => void;
    onSaved: () => void;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { delay: 0.1 } },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 350, damping: 30 },
    },
    exit: {
        opacity: 0, scale: 0.95, y: 10,
        transition: { duration: 0.15 },
    },
};

export default function ConnectorSetupModal({ connector, onClose, onSaved }: Props) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const IconComponent = CONNECTOR_ICONS[connector.type];

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/connectors/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: connector.type, credentials: values }),
            });
            const data = await res.json();
            setTestResult({ success: data.success, message: data.message });
        } catch {
            setTestResult({ success: false, message: 'Connection test failed' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/connectors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: connector.type,
                    name: connector.name,
                    credentials: values,
                }),
            });
            if (res.ok) {
                onSaved();
                onClose();
            }
        } catch {
            /* silent */
        } finally {
            setSaving(false);
        }
    };

    const allRequired = connector.fields
        .filter(f => f.required)
        .every(f => values[f.key]?.trim());

    return (
        <AnimatePresence>
            <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                    className="relative bg-[#111827] border border-white/[0.08] rounded-2xl p-0 w-full max-w-lg
                     shadow-2xl shadow-black/40 overflow-hidden"
                >
                    {/* Gradient header strip */}
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/[0.08] flex items-center justify-center"
                                >
                                    {IconComponent && <IconComponent className="w-5 h-5" />}
                                </motion.div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Connect {connector.name}</h2>
                                    <p className="text-[11px] text-slate-500">{connector.description}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </motion.button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            {connector.fields.map((field: ConnectorField, i: number) => (
                                <motion.div
                                    key={field.key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.06 }}
                                >
                                    <label htmlFor={`field-${field.key}`} className="block text-[13px] font-medium text-slate-300 mb-1.5">
                                        {field.label}
                                        {field.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>
                                    <input
                                        id={`field-${field.key}`}
                                        type={field.type === 'password' ? 'password' : 'text'}
                                        value={values[field.key] ?? ''}
                                        onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2.5 bg-black/30 border border-white/[0.06] rounded-xl text-white
                               placeholder-slate-600 focus:outline-none focus:border-emerald-500/40
                               focus:ring-1 focus:ring-emerald-500/20
                               transition-all text-sm font-mono"
                                    />
                                    {field.helpText && (
                                        <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                                            <Shield className="h-3 w-3 flex-shrink-0" />
                                            {field.helpText}
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Test result */}
                        <AnimatePresence>
                            {testResult && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${testResult.success
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/15'
                                        }`}>
                                        {testResult.success
                                            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                            : <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        }
                                        <span className="text-[13px]">{testResult.message}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex justify-between gap-3 mt-6 pt-5 border-t border-white/[0.04]">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleTest}
                                disabled={!allRequired || testing}
                                className="px-4 py-2.5 border border-white/[0.08] hover:border-white/20 text-slate-400
                           hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                           rounded-xl text-[13px] transition-all flex items-center gap-2"
                            >
                                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {testing ? 'Testing…' : 'Test Connection'}
                            </motion.button>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-white text-[13px] transition-colors">
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    disabled={!allRequired || saving}
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500
                             hover:from-emerald-500 hover:to-emerald-400
                             disabled:from-slate-700 disabled:to-slate-700
                             disabled:cursor-not-allowed text-white font-semibold rounded-xl text-[13px]
                             shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                                >
                                    {saving ? 'Connecting…' : 'Connect & Save'}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
