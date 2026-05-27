import { useState, useMemo } from "react";
import { jsonToCsv, jsonToYaml, jsonToTypeScript } from "../lib/convert";

interface Props {
  input: string;
}

type ConvertFormat = "csv" | "yaml" | "typescript";

const FORMAT_LABELS: Record<ConvertFormat, string> = {
  csv: "CSV",
  yaml: "YAML",
  typescript: "TypeScript Interface",
};

export default function ConvertPanel({ input }: Props) {
  const [format, setFormat] = useState<ConvertFormat>("csv");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return null;
    try {
      switch (format) {
        case "csv": {
          const result = jsonToCsv(input);
          return result ?? "Input must be an array of objects for CSV conversion.";
        }
        case "yaml":
          return jsonToYaml(input);
        case "typescript":
          return jsonToTypeScript(input);
      }
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [input, format]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FORMAT_LABELS) as ConvertFormat[]).map((f) => (
          <button
            key={f}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: format === f ? "var(--accent)" : "var(--panel)",
              color: format === f ? "#fff" : "var(--ink)",
              border: `1px solid ${format === f ? "var(--accent)" : "var(--line)"}`,
            }}
            onClick={() => setFormat(f)}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      {output && (
        <div className="relative">
          <button
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium z-10"
            style={{ background: "var(--line)", color: "var(--muted)" }}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre
            className="font-mono text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              maxHeight: "400px",
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {!input.trim() && (
        <div className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
          Enter JSON in the input area to convert.
        </div>
      )}
    </div>
  );
}
