import { useState, useMemo } from "react";
import { deepDiff } from "../lib/diff";
import type { DiffEntry } from "../lib/diff";

export default function DiffView() {
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  const diffs = useMemo((): DiffEntry[] | null => {
    if (!leftInput.trim() || !rightInput.trim()) return null;

    let leftParsed: unknown;
    let rightParsed: unknown;

    try {
      leftParsed = JSON.parse(leftInput);
      setLeftError(null);
    } catch (e) {
      setLeftError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }

    try {
      rightParsed = JSON.parse(rightInput);
      setRightError(null);
    } catch (e) {
      setRightError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }

    return deepDiff(leftParsed, rightParsed);
  }, [leftInput, rightInput]);

  const filteredDiffs = useMemo(() => {
    if (!diffs) return null;
    return diffs.filter((d) => d.type !== "unchanged");
  }, [diffs]);

  const summary = useMemo(() => {
    if (!diffs) return null;
    let added = 0;
    let removed = 0;
    let changed = 0;
    for (const d of diffs) {
      if (d.type === "added") added++;
      else if (d.type === "removed") removed++;
      else if (d.type === "changed") changed++;
    }
    return { added, removed, changed };
  }, [diffs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
            Left (original)
          </label>
          <textarea
            className="w-full font-mono text-sm p-3 rounded-lg resize-none"
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              border: `1px solid ${leftError ? "var(--error)" : "var(--line)"}`,
              minHeight: "200px",
            }}
            value={leftInput}
            onChange={(e) => setLeftInput(e.target.value)}
            placeholder="Paste original JSON..."
            spellCheck={false}
          />
          {leftError && (
            <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
              {leftError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
            Right (modified)
          </label>
          <textarea
            className="w-full font-mono text-sm p-3 rounded-lg resize-none"
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              border: `1px solid ${rightError ? "var(--error)" : "var(--line)"}`,
              minHeight: "200px",
            }}
            value={rightInput}
            onChange={(e) => setRightInput(e.target.value)}
            placeholder="Paste modified JSON..."
            spellCheck={false}
          />
          {rightError && (
            <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
              {rightError}
            </p>
          )}
        </div>
      </div>

      {summary && (
        <div className="flex gap-4 text-sm font-medium">
          <span style={{ color: "var(--diff-added-text)" }}>+{summary.added} added</span>
          <span style={{ color: "var(--diff-removed-text)" }}>-{summary.removed} removed</span>
          <span style={{ color: "var(--diff-changed-text)" }}>~{summary.changed} changed</span>
        </div>
      )}

      {filteredDiffs && filteredDiffs.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ background: "var(--panel)" }}>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--muted)" }}>
                  Path
                </th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--muted)" }}>
                  Type
                </th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--muted)" }}>
                  Left
                </th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--muted)" }}>
                  Right
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDiffs.map((diff, i) => {
                const bgColor =
                  diff.type === "added"
                    ? "var(--diff-added-bg)"
                    : diff.type === "removed"
                      ? "var(--diff-removed-bg)"
                      : "var(--diff-changed-bg)";
                const textColor =
                  diff.type === "added"
                    ? "var(--diff-added-text)"
                    : diff.type === "removed"
                      ? "var(--diff-removed-text)"
                      : "var(--diff-changed-text)";
                return (
                  <tr key={i} style={{ background: bgColor }}>
                    <td className="px-3 py-1.5" style={{ color: textColor }}>
                      {diff.path}
                    </td>
                    <td className="px-3 py-1.5 capitalize" style={{ color: textColor }}>
                      {diff.type}
                    </td>
                    <td className="px-3 py-1.5 truncate max-w-[200px]" style={{ color: textColor }}>
                      {diff.leftValue !== undefined ? truncateValue(diff.leftValue) : "-"}
                    </td>
                    <td className="px-3 py-1.5 truncate max-w-[200px]" style={{ color: textColor }}>
                      {diff.rightValue !== undefined ? truncateValue(diff.rightValue) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredDiffs && filteredDiffs.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
          No differences found. The two JSON values are identical.
        </div>
      )}
    </div>
  );
}

function truncateValue(value: unknown): string {
  const str = JSON.stringify(value);
  if (str.length > 60) return str.substring(0, 57) + "...";
  return str;
}
