'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface UploadedDoc {
    docId: string;
    filename: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    pageCount?: number;
}

interface DocumentUploadProps {
    documents: UploadedDoc[];
    onDocumentUploaded: (doc: UploadedDoc) => void;
    onRemoveDocument: (docId: string) => void;
    disabled?: boolean;
}

export function DocumentUpload({
    documents,
    onDocumentUploaded,
    onRemoveDocument,
    disabled,
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files are supported');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('File too large. Maximum size is 50MB.');
            return;
        }

        setError(null);

        const tempId = `temp-${Date.now()}`;
        const tempDoc: UploadedDoc = {
            docId: tempId,
            filename: file.name,
            status: 'uploading',
        };
        onDocumentUploaded(tempDoc);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();

            // Replace temp doc with real doc
            onRemoveDocument(tempId);
            onDocumentUploaded({
                docId: data.docId,
                filename: data.filename,
                status: 'processing',
            });

            // Poll for status
            pollStatus(data.docId);
        } catch (err) {
            onRemoveDocument(tempId);
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const pollStatus = async (docId: string) => {
        const maxAttempts = 60; // 5 minutes max
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 5000));

            try {
                const response = await fetch(`/api/documents/status?docId=${docId}`);
                if (!response.ok) continue;

                const data = await response.json();

                if (data.status === 'completed' || data.status === 'failed') {
                    onRemoveDocument(docId);
                    onDocumentUploaded({
                        docId,
                        filename: '',
                        status: data.status,
                        pageCount: data.pageCount,
                    });
                    return;
                }
            } catch {
                // continue polling
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const statusIcon = (status: UploadedDoc['status']) => {
        switch (status) {
            case 'uploading':
            case 'processing':
                return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
            case 'completed':
                return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
            case 'failed':
                return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
        }
    };

    const statusLabel = (status: UploadedDoc['status']) => {
        switch (status) {
            case 'uploading':
                return 'Uploading...';
            case 'processing':
                return 'Building tree index...';
            case 'completed':
                return 'Ready';
            case 'failed':
                return 'Failed';
        }
    };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${isDragging
                        ? 'border-emerald-500/60 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                    }}
                    className="hidden"
                    disabled={disabled}
                />
                <Upload className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">
                    Drop a PDF here or <span className="text-emerald-400 font-medium">browse</span>
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                    🌲 Uses PageIndex reasoning-based retrieval • Max 50MB
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* Document list */}
            {documents.length > 0 && (
                <div className="space-y-1.5">
                    {documents.map((doc) => (
                        <div
                            key={doc.docId}
                            className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2"
                        >
                            <FileText className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-300 truncate flex-1">
                                {doc.filename || doc.docId}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {statusIcon(doc.status)}
                                <span className="text-[10px] text-slate-500">{statusLabel(doc.status)}</span>
                            </div>
                            {doc.pageCount && (
                                <span className="text-[10px] text-slate-600">{doc.pageCount}p</span>
                            )}
                            <button
                                onClick={() => onRemoveDocument(doc.docId)}
                                className="text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
