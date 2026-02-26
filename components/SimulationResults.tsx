"use client"

import { SimulationResult } from "@/lib/types"

interface SimulationResultsProps {
  result: SimulationResult | null;
}

export function SimulationResults({ result }: SimulationResultsProps) {
  if (!result) return null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <h3 className="font-semibold text-white">Pre-Code Simulation</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          result.passed 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {result.passed ? '✓ PASSED' : '✗ FAILED'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{result.totalScenarios}</p>
          <p className="text-xs text-gray-500 uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{result.passedScenarios}</p>
          <p className="text-xs text-gray-500 uppercase">Passed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">{result.failedScenarios}</p>
          <p className="text-xs text-gray-500 uppercase">Failed</p>
        </div>
      </div>

      {/* Failures */}
      {result.failures?.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <h4 className="font-medium text-red-400 mb-3">⚠️ Failures Detected</h4>
          <div className="space-y-2">
            {result.failures.map((failure, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <p className="font-medium text-white mb-1">{failure.scenario}</p>
                <p className="text-sm text-gray-300">{failure.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium text-yellow-400 mb-3">💡 AI Suggestions</h4>
          <div className="space-y-2">
            {result.suggestions.map((suggestion, i) => (
              <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <p className="text-sm text-gray-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success message */}
      {result.passed && (
        <div className="p-4 bg-green-500/10">
          <p className="text-green-400 font-medium">
            ✓ All scenarios passed! Spec is ready for implementation.
          </p>
        </div>
      )}
    </div>
  );
}
