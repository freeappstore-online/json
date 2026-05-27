import { useCallback } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lineNumbers?: boolean;
}

export default function JsonInput({ value, onChange, placeholder, lineNumbers = true }: Props) {
  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 1);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Let the default paste happen, then try to auto-format
      const pasted = e.clipboardData.getData("text/plain");
      if (value.trim() === "" && pasted.trim().length > 0) {
        try {
          const parsed = JSON.parse(pasted);
          const formatted = JSON.stringify(parsed, null, 2);
          e.preventDefault();
          onChange(formatted);
        } catch {
          // Not valid JSON, let default paste happen
        }
      }
    },
    [value, onChange],
  );

  return (
    <div className="relative flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
      {lineNumbers && (
        <div
          className="flex flex-col items-end py-3 px-2 select-none font-mono text-xs leading-[1.625rem]"
          style={{ background: "var(--panel)", color: "var(--muted)", minWidth: "3rem" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      <textarea
        className="flex-1 font-mono text-sm leading-[1.625rem] p-3 resize-none w-full"
        style={{
          background: "var(--paper)",
          color: "var(--ink)",
          border: "none",
          minHeight: "200px",
          tabSize: 2,
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder ?? "Paste JSON here..."}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}
