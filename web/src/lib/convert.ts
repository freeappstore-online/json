/**
 * Convert JSON array-of-objects to CSV string.
 * Returns null if the input is not an array of objects.
 */
export function jsonToCsv(input: string): string | null {
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  // Collect all keys from all objects
  const keys = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
    for (const key of Object.keys(item as Record<string, unknown>)) {
      keys.add(key);
    }
  }

  const headers = Array.from(keys);

  function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const rows = [headers.join(",")];
  for (const item of parsed) {
    const obj = item as Record<string, unknown>;
    rows.push(headers.map((h) => escapeCell(obj[h])).join(","));
  }

  return rows.join("\n");
}

/**
 * Convert JSON to a YAML-like display string.
 */
export function jsonToYaml(input: string): string {
  const parsed: unknown = JSON.parse(input);
  return toYamlString(parsed, 0);
}

function toYamlString(value: unknown, depth: number): string {
  const indent = "  ".repeat(depth);

  if (value === null) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (value.includes("\n")) {
      const lines = value.split("\n");
      return "|\n" + lines.map((l) => `${indent}  ${l}`).join("\n");
    }
    if (value.includes(":") || value.includes("#") || value.includes("'") || value.includes('"') || value.trim() !== value) {
      return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const lines: string[] = [];
    for (const item of value) {
      const str = toYamlString(item, depth + 1);
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const objStr = str.trim();
        const firstLine = objStr.split("\n")[0];
        const rest = objStr.split("\n").slice(1);
        lines.push(`${indent}- ${firstLine}`);
        for (const r of rest) {
          lines.push(`${indent}  ${r.trimStart()}`);
        }
      } else {
        lines.push(`${indent}- ${str}`);
      }
    }
    return "\n" + lines.join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    const lines: string[] = [];
    for (const [key, val] of entries) {
      const valStr = toYamlString(val, depth + 1);
      if (typeof val === "object" && val !== null) {
        lines.push(`${indent}${key}:${valStr}`);
      } else {
        lines.push(`${indent}${key}: ${valStr}`);
      }
    }
    return "\n" + lines.join("\n");
  }

  return String(value);
}

/**
 * Generate a TypeScript interface from a JSON value.
 */
export function jsonToTypeScript(input: string): string {
  const parsed: unknown = JSON.parse(input);
  const lines: string[] = [];
  generateType(parsed, "Root", lines, new Set());
  return lines.join("\n");
}

function generateType(value: unknown, name: string, lines: string[], seen: Set<string>): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const itemType = generateType(value[0], `${name}Item`, lines, seen);
    return `${itemType}[]`;
  }

  if (typeof value === "object") {
    const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);

    if (seen.has(interfaceName)) return interfaceName;
    seen.add(interfaceName);

    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    const fields: string[] = [];

    for (const [key, val] of entries) {
      const fieldName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const childName = key.charAt(0).toUpperCase() + key.slice(1);
      const fieldType = generateType(val, childName, lines, seen);
      fields.push(`  ${fieldName}: ${fieldType};`);
    }

    lines.push(`interface ${interfaceName} {`);
    for (const f of fields) {
      lines.push(f);
    }
    lines.push("}");
    lines.push("");

    return interfaceName;
  }

  return "unknown";
}
