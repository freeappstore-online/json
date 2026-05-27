import { useState, useMemo, useCallback } from "react";
import JsonInput from "./components/JsonInput";
import SyntaxHighlight from "./components/SyntaxHighlight";
import TreeView from "./components/TreeView";
import DiffView from "./components/DiffView";
import ConvertPanel from "./components/ConvertPanel";
import StatsPanel from "./components/StatsPanel";
import HistoryPanel from "./components/HistoryPanel";
import PathQueryPanel from "./components/PathQueryPanel";
import { formatJson, minifyJson, validateJson } from "./lib/formatter";
import { addToHistory } from "./lib/history";
import type { IndentStyle, ValidationResult } from "./lib/formatter";

type Tab = "format" | "tree" | "diff" | "convert" | "path" | "stats" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "format", label: "Format" },
  { id: "tree", label: "Tree" },
  { id: "diff", label: "Diff" },
  { id: "convert", label: "Convert" },
  { id: "path", label: "Path" },
  { id: "stats", label: "Stats" },
  { id: "history", label: "History" },
];

export default function App() {
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("format");
  const [indent, setIndent] = useState<IndentStyle>("2");
  const [copied, setCopied] = useState(false);

  const validation = useMemo((): ValidationResult => validateJson(input), [input]);

  const formatted = useMemo(() => {
    if (!input.trim() || !validation.valid) return null;
    try {
      return formatJson(input, indent);
    } catch {
      return null;
    }
  }, [input, indent, validation.valid]);

  const parsed = useMemo(() => {
    if (!input.trim()) return undefined;
    try {
      return JSON.parse(input) as unknown;
    } catch {
      return undefined;
    }
  }, [input]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) return;
    try {
      const result = formatJson(input, indent);
      setInput(result);
      addToHistory(result);
    } catch {
      // Already showing validation error
    }
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    try {
      const result = minifyJson(input);
      setInput(result);
      addToHistory(result);
    } catch {
      // Already showing validation error
    }
  }, [input]);

  const handleCopy = useCallback(() => {
    const text = formatted ?? input;
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [formatted, input]);

  const handleDownload = useCallback(() => {
    const text = formatted ?? input;
    if (!text) return;
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [formatted, input]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleHistorySelect = useCallback((value: string) => {
    setInput(value);
    setTab("format");
  }, []);

  const handleSample = useCallback(() => {
    const sample = JSON.stringify(
      {
        name: "JSON Formatter",
        version: "1.0.0",
        features: ["format", "validate", "tree view", "diff", "convert"],
        settings: {
          indent: 2,
          darkMode: true,
          history: { enabled: true, maxItems: 10 },
        },
        users: [
          { id: 1, name: "Alice", active: true },
          { id: 2, name: "Bob", active: false },
        ],
        metadata: null,
      },
      null,
      2,
    );
    setInput(sample);
    addToHistory(sample);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: "var(--glass)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--accent)" }}
            >
              {"{}"}
            </div>
            <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              JSON Formatter
            </h1>
          </div>

          {/* Validation status */}
          <div className="flex items-center gap-3">
            {input.trim() && (
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  background: validation.valid ? "var(--diff-added-bg)" : "var(--diff-removed-bg)",
                  color: validation.valid ? "var(--diff-added-text)" : "var(--diff-removed-text)",
                }}
              >
                {validation.valid ? "Valid JSON" : "Invalid JSON"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav
        className="sticky top-[57px] z-10 overflow-x-auto backdrop-blur-md"
        style={{ background: "var(--glass)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                color: tab === t.id ? "var(--accent)" : "var(--muted)",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Format tab - main input + output */}
        {tab === "format" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--accent)" }}
                onClick={handleFormat}
              >
                Format
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink)" }}
                onClick={handleMinify}
              >
                Minify
              </button>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Indent:
                </span>
                {(["2", "4", "tab"] as IndentStyle[]).map((style) => (
                  <button
                    key={style}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      background: indent === style ? "var(--accent)" : "var(--panel)",
                      color: indent === style ? "#fff" : "var(--muted)",
                      border: `1px solid ${indent === style ? "var(--accent)" : "var(--line)"}`,
                    }}
                    onClick={() => setIndent(style)}
                  >
                    {style === "tab" ? "Tab" : style}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)" }}
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)" }}
                  onClick={handleDownload}
                >
                  Download
                </button>
                <button
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)" }}
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Error display */}
            {!validation.valid && validation.error && (
              <div
                className="rounded-lg px-4 py-3 text-sm font-mono"
                style={{ background: "var(--diff-removed-bg)", color: "var(--diff-removed-text)" }}
              >
                {validation.line !== undefined && (
                  <span className="font-semibold">
                    Line {validation.line}
                    {validation.column !== undefined && `, Col ${validation.column}`}:{" "}
                  </span>
                )}
                {validation.error}
              </div>
            )}

            {/* Input area */}
            <JsonInput value={input} onChange={handleInputChange} />

            {/* Sample data button when empty */}
            {!input.trim() && (
              <div className="text-center py-4">
                <button
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{ color: "var(--accent)", background: "var(--panel)", border: "1px solid var(--line)" }}
                  onClick={handleSample}
                >
                  Load Sample JSON
                </button>
              </div>
            )}

            {/* Formatted output */}
            {formatted && (
              <div>
                <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
                  Formatted Output
                </h2>
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                  <SyntaxHighlight json={formatted} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tree tab */}
        {tab === "tree" && (
          <div className="space-y-4">
            {parsed !== undefined ? (
              <TreeView data={parsed} />
            ) : (
              <div className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                Enter valid JSON in the Format tab to see the tree view.
              </div>
            )}
          </div>
        )}

        {/* Diff tab */}
        {tab === "diff" && <DiffView />}

        {/* Convert tab */}
        {tab === "convert" && <ConvertPanel input={input} />}

        {/* Path tab */}
        {tab === "path" && <PathQueryPanel input={input} />}

        {/* Stats tab */}
        {tab === "stats" && <StatsPanel input={input} />}

        {/* History tab */}
        {tab === "history" && <HistoryPanel onSelect={handleHistorySelect} />}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs" style={{ color: "var(--muted)" }}>
        <a
          href="https://freeappstore.online"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "var(--accent)" }}
        >
          FreeAppStore
        </a>
        {" "}
        &mdash; Free tools, forever.
      </footer>
    </div>
  );
}
