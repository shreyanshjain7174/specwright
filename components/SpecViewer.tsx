"use client"

import { ExecutableSpec } from "@/lib/types"

interface SpecViewerProps {
  spec: ExecutableSpec | null;
}

export function SpecViewer({ spec }: SpecViewerProps) {
  if (!spec) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg">Executable Specification will appear here</p>
          <p className="text-sm mt-2 text-gray-500">Paste context and generate to see the result</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-4">
      {/* Narrative */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">Narrative</h3>
        <h2 className="text-xl font-bold text-white mb-2">{spec.narrative.title}</h2>
        <p className="text-gray-300 mb-2"><strong>Objective:</strong> {spec.narrative.objective}</p>
        <p className="text-gray-400 text-sm"><strong>Rationale:</strong> {spec.narrative.rationale}</p>
      </div>

      {/* Context Pointers */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
          Context Pointers ({spec.contextPointers?.length || 0})
        </h3>
        <div className="space-y-2">
          {spec.contextPointers?.map((pointer, idx) => (
            <div key={idx} className="bg-gray-700/50 rounded p-3">
              <p className="text-sm font-medium text-white">{pointer.source}</p>
              <p className="text-sm text-gray-400 italic">"{pointer.snippet}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
          Constraints ({spec.constraints?.length || 0})
        </h3>
        <div className="space-y-2">
          {spec.constraints?.map((constraint, idx) => (
            <div key={idx} className="bg-gray-700/50 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  constraint.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  constraint.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {constraint.severity}
                </span>
              </div>
              <p className="text-sm text-white font-mono">{constraint.rule}</p>
              <p className="text-xs text-gray-400 mt-1">{constraint.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
          Verification ({spec.verification?.length || 0})
        </h3>
        <div className="space-y-3">
          {spec.verification?.map((scenario, idx) => (
            <div key={idx} className="bg-gray-700/50 rounded p-3 font-mono text-sm">
              <p className="font-bold text-white mb-2">Scenario: {scenario.scenario}</p>
              <div className="space-y-1 text-sm">
                {scenario.given?.map((g, i) => (
                  <p key={i} className="text-blue-400"><span className="font-bold">Given</span> {g}</p>
                ))}
                {scenario.when?.map((w, i) => (
                  <p key={i} className="text-purple-400"><span className="font-bold">When</span> {w}</p>
                ))}
                {scenario.then?.map((t, i) => (
                  <p key={i} className="text-green-400"><span className="font-bold">Then</span> {t}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
