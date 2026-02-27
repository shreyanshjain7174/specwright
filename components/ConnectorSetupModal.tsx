'use client';

import { useState } from 'react';
import { ConnectorMeta, ConnectorField } from '@/lib/connectors/types';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    connector: ConnectorMeta;
    onClose: () => void;
    onSaved: () => void;
}

export default function ConnectorSetupModal({ connector, onClose, onSaved }: Props) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{connector.icon}</span>
                        <div>
                            <h2 className="text-lg font-bold text-white">Connect {connector.name}</h2>
                            <p className="text-xs text-slate-400">{connector.description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    {connector.fields.map((field: ConnectorField) => (
                        <div key={field.key}>
                            <label htmlFor={`field-${field.key}`} className="block text-sm font-medium text-slate-300 mb-1.5">
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <input
                                id={`field-${field.key}`}
                                type={field.type === 'password' ? 'password' : 'text'}
                                value={values[field.key] ?? ''}
                                onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white
                           placeholder-slate-500 focus:outline-none focus:border-emerald-500
                           transition-colors text-sm font-mono"
                            />
                            {field.helpText && (
                                <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Test result */}
                {testResult && (
                    <div className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${testResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {testResult.success
                            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            : <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        }
                        <span>{testResult.message}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between gap-3 mt-6">
                    <button
                        onClick={handleTest}
                        disabled={!allRequired || testing}
                        className="px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300
                       hover:text-white disabled:opacity-40 disabled:cursor-not-allowed
                       rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {testing ? 'Testing…' : 'Test Connection'}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!allRequired || saving}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                         disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
                        >
                            {saving ? 'Connecting…' : 'Connect & Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
