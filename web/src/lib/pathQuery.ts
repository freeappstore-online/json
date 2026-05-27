/**
 * Resolve a dot/bracket notation path against a parsed JSON value.
 * Examples: "data.users[0].name", "foo.bar", "[0].id"
 * Returns { found: true, value } or { found: false }.
 */
export function resolvePath(
  root: unknown,
  path: string,
): { found: true; value: unknown } | { found: false } {
  if (path.trim() === "") return { found: true, value: root };

  // Parse the path into segments
  const segments: (string | number)[] = [];
  let remaining = path.trim();

  while (remaining.length > 0) {
    // Strip leading dot
    if (remaining.startsWith(".")) {
      remaining = remaining.substring(1);
    }

    // Bracket notation
    if (remaining.startsWith("[")) {
      const end = remaining.indexOf("]");
      if (end === -1) return { found: false };
      const inner = remaining.substring(1, end);
      remaining = remaining.substring(end + 1);

      // Could be a number index or a quoted string key
      if (/^\d+$/.test(inner)) {
        segments.push(parseInt(inner, 10));
      } else {
        // Remove quotes if present
        const unquoted = inner.replace(/^["']|["']$/g, "");
        segments.push(unquoted);
      }
      continue;
    }

    // Dot notation property
    const dotIdx = remaining.indexOf(".");
    const bracketIdx = remaining.indexOf("[");

    let end: number;
    if (dotIdx === -1 && bracketIdx === -1) {
      end = remaining.length;
    } else if (dotIdx === -1) {
      end = bracketIdx;
    } else if (bracketIdx === -1) {
      end = dotIdx;
    } else {
      end = Math.min(dotIdx, bracketIdx);
    }

    const segment = remaining.substring(0, end);
    if (segment.length > 0) {
      segments.push(segment);
    }
    remaining = remaining.substring(end);
  }

  // Walk the path
  let current: unknown = root;
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return { found: false };
    }

    if (typeof seg === "number") {
      if (!Array.isArray(current)) return { found: false };
      if (seg < 0 || seg >= current.length) return { found: false };
      current = current[seg];
    } else {
      if (Array.isArray(current)) return { found: false };
      const obj = current as Record<string, unknown>;
      if (!(seg in obj)) return { found: false };
      current = obj[seg];
    }
  }

  return { found: true, value: current };
}
