import { useState, useCallback } from "react";
import { getHistory, clearHistory } from "../lib/history";
import type { HistoryEntry } from "../lib/history";

interface Props {
  onSelect: (input: string) => void;
}

export default function HistoryPanel({ onSelect }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>(getHistory);

  const handleClear = useCallback(() => {
    clearHistory();
    setEntries([]);
  }, []);

  const handleRefresh = useCallback(() => {
    setEntries(getHistory());
  }, []);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No history yet. Format some JSON to get started.
        </p>
        <button
          className="text-xs px-3 py-1 rounded"
          style={{ color: "var(--accent)" }}
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Last {entries.length} input{entries.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--accent)" }}
            onClick={handleRefresh}
          >
            Refresh
          </button>
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--error)" }}
            onClick={handleClear}
          >
            Clear All
          </button>
        </div>
      </div>

      {entries.map((entry) => (
        <button
          key={entry.id}
          className="w-full text-left p-3 rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          onClick={() => onSelect(entry.input)}
        >
          <div className="flex justify-between items-start gap-2">
            <code className="text-xs font-mono truncate flex-1" style={{ color: "var(--ink)" }}>
              {entry.preview}
            </code>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--muted)" }}>
              {new Date(entry.timestamp).toLocaleDateString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
