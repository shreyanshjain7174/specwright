'use client';

import { TreePine, FileSearch, MapPin } from 'lucide-react';

interface RetrievalTrace {
    node_id: string;
    title: string;
    page_range: [number, number];
    reasoning: string;
    content: string;
}

interface RetrievalSource {
    method: 'direct' | 'pageindex';
    source: string;
    traces?: RetrievalTrace[];
}

interface RetrievalTracesProps {
    sources: RetrievalSource[];
}

export function RetrievalTraces({ sources }: RetrievalTracesProps) {
    if (!sources.length) return null;

    const pageindexSources = sources.filter((s) => s.method === 'pageindex');
    const directSources = sources.filter((s) => s.method === 'direct');

    return (
        <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Retrieval Sources
            </h4>

            {/* Direct context badge */}
            {directSources.map((s, i) => (
                <div
                    key={`direct-${i}`}
                    className="flex items-center gap-2 text-xs bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2"
                >
                    <FileSearch className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-400">📝 Direct context — pasted input</span>
                </div>
            ))}

            {/* PageIndex reasoning traces */}
            {pageindexSources.map((s, i) => (
                <div key={`pi-${i}`} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <TreePine className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-400 font-medium">
                            🌲 PageIndex reasoning retrieval
                        </span>
                        <span className="text-slate-500 ml-auto">{s.source}</span>
                    </div>

                    {/* Individual traces */}
                    {s.traces && s.traces.length > 0 && (
                        <div className="ml-4 space-y-1.5">
                            {s.traces.map((trace, j) => (
                                <div
                                    key={j}
                                    className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-3 w-3 text-emerald-500/60" />
                                        <span className="text-xs font-medium text-slate-300">
                                            {trace.title}
                                        </span>
                                        {trace.page_range[0] > 0 && (
                                            <span className="text-[10px] text-slate-600 ml-auto">
                                                pp. {trace.page_range[0]}–{trace.page_range[1]}
                                            </span>
                                        )}
                                    </div>
                                    {trace.reasoning && (
                                        <p className="text-[11px] text-slate-500 italic mb-1">
                                            Why: {trace.reasoning}
                                        </p>
                                    )}
                                    {trace.content && (
                                        <p className="text-[11px] text-slate-400 line-clamp-3">
                                            {trace.content}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
