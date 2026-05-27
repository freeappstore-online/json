export type DiffType = "added" | "removed" | "changed" | "unchanged";

export interface DiffEntry {
  path: string;
  type: DiffType;
  leftValue?: unknown;
  rightValue?: unknown;
}

export function deepDiff(left: unknown, right: unknown, path = ""): DiffEntry[] {
  const results: DiffEntry[] = [];

  if (left === right) {
    results.push({ path: path || "(root)", type: "unchanged", leftValue: left, rightValue: right });
    return results;
  }

  if (left === null || right === null || typeof left !== typeof right) {
    if (left !== undefined && right !== undefined) {
      results.push({ path: path || "(root)", type: "changed", leftValue: left, rightValue: right });
    } else if (left === undefined) {
      results.push({ path: path || "(root)", type: "added", rightValue: right });
    } else {
      results.push({ path: path || "(root)", type: "removed", leftValue: left });
    }
    return results;
  }

  if (typeof left !== "object") {
    results.push({ path: path || "(root)", type: "changed", leftValue: left, rightValue: right });
    return results;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);

  if (leftIsArray && rightIsArray) {
    const maxLen = Math.max(left.length, right.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= left.length) {
        results.push({ path: itemPath, type: "added", rightValue: (right as unknown[])[i] });
      } else if (i >= right.length) {
        results.push({ path: itemPath, type: "removed", leftValue: (left as unknown[])[i] });
      } else {
        results.push(...deepDiff((left as unknown[])[i], (right as unknown[])[i], itemPath));
      }
    }
    return results;
  }

  if (leftIsArray !== rightIsArray) {
    results.push({ path: path || "(root)", type: "changed", leftValue: left, rightValue: right });
    return results;
  }

  // Both are objects
  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);

  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in leftObj)) {
      results.push({ path: keyPath, type: "added", rightValue: rightObj[key] });
    } else if (!(key in rightObj)) {
      results.push({ path: keyPath, type: "removed", leftValue: leftObj[key] });
    } else {
      results.push(...deepDiff(leftObj[key], rightObj[key], keyPath));
    }
  }

  return results;
}
