"use client"

interface ContextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ContextInput({ value, onChange, disabled }: ContextInputProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Raw Context</h3>
        <p className="text-sm text-gray-400">
          Paste Slack threads, customer feedback, GitHub issues, etc.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your context here..."
        className="flex-1 w-full p-4 bg-white border border-gray-300 rounded-lg 
                   text-black placeholder-gray-400 font-mono text-sm leading-relaxed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   resize-none min-h-[400px]"
      />
    </div>
  );
}
