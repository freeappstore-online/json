import { useState, useMemo } from "react";
import { resolvePath } from "../lib/pathQuery";

interface Props {
  input: string;
}

export default function PathQueryPanel({ input }: Props) {
  const [path, setPath] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim() || !path.trim()) return null;
    try {
      const parsed = JSON.parse(input);
      return resolvePath(parsed, path);
    } catch {
      return null;
    }
  }, [input, path]);

  const handleCopy = () => {
    if (result?.found) {
      navigator.clipboard.writeText(JSON.stringify(result.value, null, 2)).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
          style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink)" }}
          placeholder="Enter path (e.g., data.users[0].name)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        {result?.found && (
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--line)", color: "var(--muted)" }}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {path.trim() && result && (
        <div className="rounded-lg p-3" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          {result.found ? (
            <pre className="font-mono text-sm whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
              {JSON.stringify(result.value, null, 2)}
            </pre>
          ) : (
            <p className="text-sm" style={{ color: "var(--error)" }}>
              Path not found
            </p>
          )}
        </div>
      )}

      {!input.trim() && (
        <div className="text-center py-6 text-sm" style={{ color: "var(--muted)" }}>
          Enter JSON in the input area to query paths.
        </div>
      )}

      <div className="text-xs space-y-1" style={{ color: "var(--muted)" }}>
        <p className="font-medium">Examples:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>
            <code className="font-mono">users[0].name</code> — first user's name
          </li>
          <li>
            <code className="font-mono">config.database.host</code> — nested property
          </li>
          <li>
            <code className="font-mono">[0]</code> — first element of root array
          </li>
          <li>
            <code className="font-mono">["special-key"]</code> — bracket notation for special chars
          </li>
        </ul>
      </div>
    </div>
  );
}
