import { useMemo } from "react";

interface Props {
  json: string;
  showLineNumbers?: boolean;
}

interface Token {
  type: "key" | "string" | "number" | "boolean" | "null" | "bracket" | "punctuation" | "whitespace";
  value: string;
}

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let expectKey = false;

  while (i < json.length) {
    const ch = json[i]!;

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      let ws = "";
      while (i < json.length && (json[i] === " " || json[i] === "\t" || json[i] === "\n" || json[i] === "\r")) {
        ws += json[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    // Brackets
    if (ch === "{" || ch === "[") {
      tokens.push({ type: "bracket", value: ch });
      expectKey = ch === "{";
      i++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      tokens.push({ type: "bracket", value: ch });
      expectKey = false;
      i++;
      continue;
    }

    // Colon
    if (ch === ":") {
      tokens.push({ type: "punctuation", value: ch });
      expectKey = false;
      i++;
      continue;
    }

    // Comma
    if (ch === ",") {
      tokens.push({ type: "punctuation", value: ch });
      // After comma in an object, next string is a key
      // We check if we're inside an object by looking at previous bracket
      const lastBracket = findLastBracket(tokens);
      expectKey = lastBracket === "{";
      i++;
      continue;
    }

    // String
    if (ch === '"') {
      let str = '"';
      i++;
      while (i < json.length && json[i] !== '"') {
        if (json[i] === "\\") {
          str += json[i];
          i++;
          if (i < json.length) {
            str += json[i];
            i++;
          }
        } else {
          str += json[i];
          i++;
        }
      }
      if (i < json.length) {
        str += '"';
        i++;
      }

      if (expectKey) {
        tokens.push({ type: "key", value: str });
        expectKey = false;
      } else {
        tokens.push({ type: "string", value: str });
      }
      continue;
    }

    // Number
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let num = "";
      while (i < json.length && /[0-9eE.+\-]/.test(json[i]!)) {
        num += json[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // true/false/null
    if (json.substring(i, i + 4) === "true") {
      tokens.push({ type: "boolean", value: "true" });
      i += 4;
      continue;
    }
    if (json.substring(i, i + 5) === "false") {
      tokens.push({ type: "boolean", value: "false" });
      i += 5;
      continue;
    }
    if (json.substring(i, i + 4) === "null") {
      tokens.push({ type: "null", value: "null" });
      i += 4;
      continue;
    }

    // Unknown character
    tokens.push({ type: "punctuation", value: ch });
    i++;
  }

  return tokens;
}

function findLastBracket(tokens: Token[]): string | null {
  const stack: string[] = [];
  for (const t of tokens) {
    if (t.type === "bracket") {
      if (t.value === "{" || t.value === "[") {
        stack.push(t.value);
      } else {
        stack.pop();
      }
    }
  }
  return stack.length > 0 ? stack[stack.length - 1]! : null;
}

const colorMap: Record<Token["type"], string> = {
  key: "var(--json-key)",
  string: "var(--json-string)",
  number: "var(--json-number)",
  boolean: "var(--json-boolean)",
  null: "var(--json-null)",
  bracket: "var(--json-bracket)",
  punctuation: "var(--muted)",
  whitespace: "inherit",
};

export default function SyntaxHighlight({ json, showLineNumbers = true }: Props) {
  const tokens = useMemo(() => tokenize(json), [json]);

  const lines = useMemo(() => {
    const result: Token[][] = [[]];
    for (const token of tokens) {
      if (token.type === "whitespace" && token.value.includes("\n")) {
        const parts = token.value.split("\n");
        // Add trailing part to current line
        if (parts[0] && parts[0].length > 0) {
          result[result.length - 1]!.push({ type: "whitespace", value: parts[0] });
        }
        // Create new lines for each newline
        for (let i = 1; i < parts.length; i++) {
          result.push([]);
          const part = parts[i];
          if (part && part.length > 0) {
            result[result.length - 1]!.push({ type: "whitespace", value: part });
          }
        }
      } else {
        result[result.length - 1]!.push(token);
      }
    }
    return result;
  }, [tokens]);

  return (
    <div className="flex font-mono text-sm overflow-auto" style={{ background: "var(--panel)" }}>
      {showLineNumbers && (
        <div
          className="flex flex-col items-end py-3 px-2 select-none text-xs leading-[1.625rem] sticky left-0"
          style={{ color: "var(--muted)", minWidth: "3rem", background: "var(--panel)" }}
        >
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      <pre className="p-3 m-0 leading-[1.625rem] whitespace-pre overflow-x-auto flex-1">
        {lines.map((lineTokens, lineIdx) => (
          <div key={lineIdx}>
            {lineTokens.length === 0 ? (
              <span>{"\n"}</span>
            ) : (
              lineTokens.map((token, tokenIdx) => (
                <span key={tokenIdx} style={{ color: colorMap[token.type] }}>
                  {token.value}
                </span>
              ))
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}
