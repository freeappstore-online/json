const STORAGE_KEY = "json-formatter-history";
const MAX_ITEMS = 10;

export interface HistoryEntry {
  id: string;
  input: string;
  timestamp: number;
  preview: string;
}

function makePreview(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length <= 60) return trimmed;
  return trimmed.substring(0, 57) + "...";
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(input: string): void {
  if (input.trim() === "") return;
  try {
    JSON.parse(input);
  } catch {
    return; // Only save valid JSON
  }

  const history = getHistory();

  // Don't add duplicates (by content)
  const exists = history.some((h) => h.input === input);
  if (exists) return;

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    input,
    timestamp: Date.now(),
    preview: makePreview(input),
  };

  const updated = [entry, ...history].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full, clear oldest
    const smaller = updated.slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(smaller));
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
