"use client"

export function LoadingState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <div className="animate-spin h-12 w-12 border-4 border-gray-600 border-t-blue-500 rounded-full mb-4" />
      <p className="text-lg font-medium text-white mb-2">Generating Executable Spec</p>
      <div className="space-y-1 text-center text-sm text-gray-500">
        <p>Parsing narrative layer...</p>
        <p>Extracting context pointers...</p>
        <p>Identifying constraints...</p>
        <p>Generating verification scenarios...</p>
      </div>
    </div>
  );
}
