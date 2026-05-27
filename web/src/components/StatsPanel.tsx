import { useMemo } from "react";
import { computeStats } from "../lib/formatter";

interface Props {
  input: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StatsPanel({ input }: Props) {
  const stats = useMemo(() => computeStats(input), [input]);

  if (!stats) {
    return (
      <div className="text-center py-6 text-sm" style={{ color: "var(--muted)" }}>
        Enter valid JSON to see statistics.
      </div>
    );
  }

  const items = [
    { label: "Depth", value: String(stats.depth), icon: "\u{1F4CA}" },
    { label: "Total Keys", value: String(stats.totalKeys), icon: "\u{1F511}" },
    { label: "Total Values", value: String(stats.totalValues), icon: "\u{1F4DD}" },
    { label: "Size", value: formatBytes(stats.sizeBytes), icon: "\u{1F4C2}" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg p-4 text-center"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            {item.value}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
