import { useState, useCallback, useMemo } from "react";

interface Props {
  data: unknown;
  searchTerm?: string;
}

interface TreeNodeProps {
  label: string;
  value: unknown;
  path: string;
  depth: number;
  searchTerm: string;
  defaultExpanded?: boolean;
}

function matchesSearch(text: string, search: string): boolean {
  if (!search) return false;
  return text.toLowerCase().includes(search.toLowerCase());
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback: no-op
  });
}

function TreeNode({ label, value, path, depth, searchTerm, defaultExpanded = false }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 1);
  const [copied, setCopied] = useState(false);

  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const handleCopyPath = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      copyToClipboard(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [path],
  );

  const labelHighlighted = matchesSearch(label, searchTerm);
  const valueStr = isExpandable ? "" : JSON.stringify(value);
  const valueHighlighted = matchesSearch(valueStr, searchTerm);

  const typeColor = useMemo(() => {
    if (value === null) return "var(--json-null)";
    if (typeof value === "string") return "var(--json-string)";
    if (typeof value === "number") return "var(--json-number)";
    if (typeof value === "boolean") return "var(--json-boolean)";
    return "var(--ink)";
  }, [value]);

  const childEntries = useMemo(() => {
    if (isArray) {
      return (value as unknown[]).map((item, i) => ({
        key: String(i),
        label: String(i),
        value: item,
        path: path ? `${path}[${i}]` : `[${i}]`,
      }));
    }
    if (isObject) {
      return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({
        key,
        label: key,
        value: val,
        path: path ? `${path}.${key}` : key,
      }));
    }
    return [];
  }, [value, path, isArray, isObject]);

  const bracketOpen = isArray ? "[" : "{";
  const bracketClose = isArray ? "]" : "}";
  const count = childEntries.length;

  return (
    <div style={{ paddingLeft: depth > 0 ? "1.25rem" : "0" }}>
      <div
        className="flex items-center gap-1.5 py-0.5 group cursor-pointer rounded px-1 hover:opacity-80"
        style={{ background: labelHighlighted || valueHighlighted ? "var(--diff-changed-bg)" : "transparent" }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {isExpandable ? (
          <span
            className="text-xs select-none w-4 text-center flex-shrink-0"
            style={{ color: "var(--muted)" }}
          >
            {expanded ? "▼" : "▶"}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <span className="font-mono text-sm" style={{ color: "var(--json-key)" }}>
          {label}
        </span>

        {isExpandable ? (
          <span className="font-mono text-xs" style={{ color: "var(--json-bracket)" }}>
            {bracketOpen}
            {!expanded && (
              <span style={{ color: "var(--muted)" }}>
                {" "}{count} {count === 1 ? "item" : "items"}{" "}
              </span>
            )}
            {!expanded && bracketClose}
          </span>
        ) : (
          <>
            <span style={{ color: "var(--muted)" }}>:</span>
            <span className="font-mono text-sm truncate" style={{ color: typeColor }}>
              {typeof value === "string" ? `"${value}"` : String(value)}
            </span>
          </>
        )}

        <button
          className="ml-auto opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded flex-shrink-0 transition-opacity"
          style={{ background: "var(--line)", color: "var(--muted)" }}
          onClick={handleCopyPath}
          title={`Copy path: ${path}`}
        >
          {copied ? "Copied!" : "path"}
        </button>
      </div>

      {isExpandable && expanded && (
        <div>
          {childEntries.map((entry) => (
            <TreeNode
              key={entry.key}
              label={entry.label}
              value={entry.value}
              path={entry.path}
              depth={depth + 1}
              searchTerm={searchTerm}
            />
          ))}
          <div className="font-mono text-xs py-0.5" style={{ color: "var(--json-bracket)", paddingLeft: "1.75rem" }}>
            {bracketClose}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreeView({ data, searchTerm = "" }: Props) {
  const [search, setSearch] = useState(searchTerm);

  const isArray = Array.isArray(data);
  const isObject = typeof data === "object" && data !== null;

  if (!isObject) {
    return (
      <div className="font-mono text-sm p-3" style={{ color: "var(--ink)" }}>
        {JSON.stringify(data)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <input
          type="text"
          className="w-full px-3 py-1.5 rounded-lg font-mono text-sm"
          style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink)" }}
          placeholder="Search in tree..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="rounded-lg overflow-auto p-2" style={{ background: "var(--panel)", maxHeight: "500px" }}>
        <TreeNode
          label={isArray ? "Array" : "Object"}
          value={data}
          path=""
          depth={0}
          searchTerm={search}
          defaultExpanded
        />
      </div>
    </div>
  );
}
