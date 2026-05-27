export type IndentStyle = "2" | "4" | "tab";

function indentString(style: IndentStyle): string {
  switch (style) {
    case "2":
      return "  ";
    case "4":
      return "    ";
    case "tab":
      return "\t";
  }
}

export function formatJson(input: string, indent: IndentStyle): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indentString(indent));
}

export function minifyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

export function validateJson(input: string): ValidationResult {
  if (input.trim() === "") {
    return { valid: true };
  }
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : String(e);
    // Try to extract position from error message
    // Common formats: "at position 42", "at line 3 column 5"
    const posMatch = msg.match(/at position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]!, 10);
      const lines = input.substring(0, pos).split("\n");
      const line = lines.length;
      const column = (lines[lines.length - 1]?.length ?? 0) + 1;
      return { valid: false, error: msg, line, column };
    }
    return { valid: false, error: msg };
  }
}

export interface JsonStats {
  depth: number;
  totalKeys: number;
  totalValues: number;
  sizeBytes: number;
}

export function computeStats(input: string): JsonStats | null {
  try {
    const parsed: unknown = JSON.parse(input);
    let maxDepth = 0;
    let totalKeys = 0;
    let totalValues = 0;

    function walk(value: unknown, depth: number): void {
      if (depth > maxDepth) maxDepth = depth;

      if (value === null || typeof value !== "object") {
        totalValues++;
        return;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item, depth + 1);
        }
        return;
      }

      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        totalKeys++;
        walk(obj[key], depth + 1);
      }
    }

    walk(parsed, 0);

    return {
      depth: maxDepth,
      totalKeys,
      totalValues,
      sizeBytes: new TextEncoder().encode(input).length,
    };
  } catch {
    return null;
  }
}
