'use client';

import { cn } from '@/lib/utils';
import { Layers, Hash } from 'lucide-react';

export interface ContentChunk {
  index: number;
  text: string;
  wordCount: number;
  embedding?: 'pending' | 'done' | 'error';
}

interface ContextChunksPreviewProps {
  chunks: ContentChunk[];
  isEmbedding?: boolean;
  className?: string;
}

function chunkText(text: string, maxWords = 60): ContentChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: ContentChunk[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const slice = words.slice(i, i + maxWords);
    chunks.push({
      index: chunks.length,
      text: slice.join(' '),
      wordCount: slice.length,
      embedding: 'pending',
    });
  }
  return chunks;
}

export function previewChunks(content: string): ContentChunk[] {
  return chunkText(content, 60);
}

export function ContextChunksPreview({ chunks, isEmbedding, className }: ContextChunksPreviewProps) {
  if (chunks.length === 0) {
    return (
      <div className={cn('text-center py-8 text-slate-500', className)}>
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
        <p className="text-sm">Content will be chunked here</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="text-sm font-medium text-white">
            {chunks.length} semantic chunk{chunks.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isEmbedding && (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
            Embedding…
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {chunks.map((chunk) => (
          <div
            key={chunk.index}
            className={cn(
              'flex gap-3 p-3 rounded-lg border text-xs transition-all',
              chunk.embedding === 'done'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : chunk.embedding === 'error'
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-slate-700 bg-slate-800/50'
            )}
          >
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-700 text-slate-400 font-mono text-[10px]">
                {chunk.index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 leading-relaxed line-clamp-3">{chunk.text}</p>
              <div className="flex items-center gap-3 mt-1.5 text-slate-600">
                <span className="flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                  {chunk.wordCount} words
                </span>
                {chunk.embedding === 'done' && (
                  <span className="text-emerald-400">✓ Embedded</span>
                )}
                {chunk.embedding === 'error' && (
                  <span className="text-red-400">✗ Error</span>
                )}
                {chunk.embedding === 'pending' && isEmbedding && (
                  <span className="text-slate-500">Queued…</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        Each chunk will be semantically embedded and stored in the vector index for RAG retrieval.
      </p>
    </div>
  );
}
