'use client';

import { useState } from 'react';
import { Copy, Download, TestTube2, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutableSpec, SimulationResult } from '@/lib/types';

interface ExportButtonsProps {
  spec: ExecutableSpec;
  simulation?: SimulationResult | null;
  className?: string;
  onConnectCursor?: () => void;
}

function useClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

function specToMarkdown(spec: ExecutableSpec): string {
  const lines: string[] = [];
  lines.push(`# ${spec.narrative.title}`);
  lines.push('');
  lines.push('## Objective');
  lines.push(spec.narrative.objective);
  lines.push('');
  lines.push('## Rationale');
  lines.push(spec.narrative.rationale);
  lines.push('');
  if (spec.contextPointers.length > 0) {
    lines.push('## Context Evidence');
    spec.contextPointers.forEach((p) => {
      lines.push(`- **${p.source}**: "${p.snippet}"`);
    });
    lines.push('');
  }
  if (spec.constraints.length > 0) {
    lines.push('## Constraints');
    spec.constraints.forEach((c) => {
      lines.push(`- **[${c.severity.toUpperCase()}] DO NOT ${c.rule}**: ${c.rationale}`);
    });
    lines.push('');
  }
  if (spec.verification.length > 0) {
    lines.push('## Acceptance Tests (Gherkin)');
    spec.verification.forEach((v) => {
      lines.push(`### Scenario: ${v.scenario}`);
      v.given.forEach((g, i) => lines.push(`${i === 0 ? 'Given' : 'And'} ${g}`));
      v.when.forEach((w, i) => lines.push(`${i === 0 ? 'When' : 'And'} ${w}`));
      v.then.forEach((t, i) => lines.push(`${i === 0 ? 'Then' : 'And'} ${t}`));
      lines.push('');
    });
  }
  return lines.join('\n');
}

function specToGherkin(spec: ExecutableSpec): string {
  const lines: string[] = [];
  lines.push(`Feature: ${spec.narrative.title}`);
  lines.push(`  # ${spec.narrative.objective}`);
  lines.push('');
  spec.verification.forEach((v) => {
    lines.push(`  Scenario: ${v.scenario}`);
    v.given.forEach((g, i) => lines.push(`    ${i === 0 ? 'Given' : 'And'} ${g}`));
    v.when.forEach((w, i) => lines.push(`    ${i === 0 ? 'When' : 'And'} ${w}`));
    v.then.forEach((t, i) => lines.push(`    ${i === 0 ? 'Then' : 'And'} ${t}`));
    lines.push('');
  });
  return lines.join('\n');
}

export function ExportButtons({ spec, simulation, className, onConnectCursor }: ExportButtonsProps) {
  const { copied, copy } = useClipboard();

  const handleDownloadJSON = () => {
    const data = { spec, simulation, exportedAt: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-${spec.narrative.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buttons = [
    {
      key: 'markdown',
      label: copied === 'markdown' ? 'Copied!' : 'Copy as Markdown',
      icon: copied === 'markdown' ? Check : Copy,
      onClick: () => copy(specToMarkdown(spec), 'markdown'),
      variant: 'secondary',
    },
    {
      key: 'json',
      label: 'Download JSON',
      icon: Download,
      onClick: handleDownloadJSON,
      variant: 'secondary',
    },
    {
      key: 'gherkin',
      label: copied === 'gherkin' ? 'Copied!' : 'Copy Gherkin',
      icon: copied === 'gherkin' ? Check : TestTube2,
      onClick: () => copy(specToGherkin(spec), 'gherkin'),
      variant: 'secondary',
    },
    {
      key: 'cursor',
      label: 'Connect to Cursor',
      icon: Terminal,
      onClick: onConnectCursor,
      variant: 'primary',
    },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {buttons.map((btn) => (
        <button
          key={btn.key}
          onClick={btn.onClick}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            btn.variant === 'primary'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white',
            copied === btn.key && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          )}
          aria-label={btn.label}
        >
          <btn.icon className="h-3.5 w-3.5" aria-hidden="true" />
          {btn.label}
        </button>
      ))}
    </div>
  );
}
