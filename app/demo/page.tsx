'use client';

import { useState } from 'react';
import { ContextInput } from '@/components/ContextInput';
import { SpecViewer } from '@/components/SpecViewer';
import { SimulationResults } from '@/components/SimulationResults';
import { LoadingState } from '@/components/LoadingState';
import { ExecutableSpec, SimulationResult } from '@/lib/types';
import { Sparkles, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const EXAMPLE_CONTEXT = `[Slack #product-feedback]
@sarah: Hey, can we add bulk delete for documents? Our enterprise customers keep asking for it.
@mike: Seems straightforward, maybe 3-4 days?
@sarah: Ship it! 🚀

[GitHub Issue #892]
Title: Add bulk document deletion
Description: Users want to delete multiple documents at once. Should be simple - just loop through and delete.

[Zendesk Ticket #4521]
Customer: "We need to clean up old files but it's taking forever one by one"
Note: Enterprise customer, $50k ARR

[Engineering Slack - buried in thread from 3 months ago]
@dave: Remember guys, our permission system checks are only on single-doc endpoints. Bulk operations bypass them currently. TODO: fix before we add any bulk features.`;

export default function DemoPage() {
  const [context, setContext] = useState(EXAMPLE_CONTEXT);
  const [spec, setSpec] = useState<ExecutableSpec | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!context.trim()) return;
    
    setIsLoading(true);
    setSpec(null);
    setSimulation(null);
    setError(null);

    try {
      // Step 1: Compile the spec
      const compileResponse = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      if (!compileResponse.ok) {
        const errorData = await compileResponse.json();
        throw new Error(errorData.error || 'Failed to generate spec');
      }

      const { spec: generatedSpec } = await compileResponse.json();
      setSpec(generatedSpec);
      setIsLoading(false);
      setIsSimulating(true);

      // Step 2: Run simulation
      const simulateResponse = await fetch('/api/specs/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: generatedSpec }),
      });

      if (!simulateResponse.ok) {
        const errorData = await simulateResponse.json();
        throw new Error(errorData.error || 'Failed to run simulation');
      }

      const { result } = await simulateResponse.json();
      setSimulation(result);

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setIsSimulating(false);
    }
  };

  const handleExport = () => {
    if (!spec) return;
    
    const exportData = {
      spec,
      simulation,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      exportedFrom: 'The Reasoning Engine'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-${spec.narrative.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-100">The Reasoning Engine</h1>
              <p className="text-sm text-gray-500">Transform chaos into executable specifications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!context.trim() || isLoading || isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 
                         disabled:bg-gray-700 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Generating...' : isSimulating ? 'Simulating...' : 'Generate Spec'}
            </button>
            {spec && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 
                           hover:border-gray-500 hover:bg-gray-800
                           text-gray-300 font-medium rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 mb-6" style={{ minHeight: '500px' }}>
          {/* Left: Context Input */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <ContextInput 
              value={context} 
              onChange={setContext} 
              disabled={isLoading || isSimulating}
            />
          </div>

          {/* Right: Spec Viewer or Loading */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 overflow-hidden">
            {isLoading ? (
              <LoadingState />
            ) : (
              <SpecViewer spec={spec} />
            )}
          </div>
        </div>

        {/* Bottom: Simulation Results */}
        {(simulation || isSimulating) && (
          <div className="mb-6">
            {isSimulating ? (
              <div className="border border-gray-700 rounded-lg p-8 bg-gray-900/50">
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-blue-500 rounded-full" />
                  Running pre-code simulation...
                </div>
              </div>
            ) : (
              <SimulationResults result={simulation} />
            )}
          </div>
        )}

        {/* Demo Instructions */}
        {!spec && !isLoading && !error && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">👆 Paste some context in the left panel, then click <strong className="text-gray-300">"Generate Spec"</strong></p>
            <p className="text-sm">Try the placeholder example — it's the "Bulk Delete Disaster" case study</p>
          </div>
        )}
      </main>
    </div>
  );
}
