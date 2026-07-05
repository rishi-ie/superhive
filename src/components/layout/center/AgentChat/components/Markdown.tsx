import type { ReactNode } from "react";

interface MarkdownProps {
  content: string;
}

function extractCodeBlocks(content: string): Array<{ type: "text" | "code"; content: string; lang?: string }> {
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", content: (match[2] ?? "").trim(), lang: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts;
}

function parseInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    const part = match[0];
    if (part.startsWith("`") && part.endsWith("`")) {
      result.push(
        <code key={match.index} className="bg-muted text-[13px] px-1 py-0.5 rounded font-mono text-foreground/90">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("**") && part.endsWith("**")) {
      result.push(<strong key={match.index}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      result.push(<em key={match.index}>{part.slice(1, -1)}</em>);
    }
    lastIndex = match.index + part.length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

function parseLine(line: string): ReactNode {
  const trimmed = line.trim();

  if (trimmed.startsWith("### ")) {
    return <h3 key={line} className="text-base font-semibold mt-4 mb-2 text-foreground">{parseInline(trimmed.slice(4))}</h3>;
  }
  if (trimmed.startsWith("## ")) {
    return <h2 key={line} className="text-lg font-semibold mt-5 mb-2 text-foreground">{parseInline(trimmed.slice(3))}</h2>;
  }
  if (trimmed.startsWith("# ")) {
    return <h1 key={line} className="text-xl font-bold mt-6 mb-3 text-foreground">{parseInline(trimmed.slice(2))}</h1>;
  }

  const listMatch = trimmed.match(/^(- \[x\]|- \[ \]|-|\d+\.)\s/);
  if (listMatch) {
    const content = trimmed.slice(listMatch[0].length);
    if (trimmed.startsWith("- [x]")) {
      return (
        <div key={line} className="flex items-start gap-2 py-0.5">
          <span className="text-emerald-400 mt-0.5">✓</span>
          <span className="text-foreground/80 line-through opacity-60">{parseInline(content)}</span>
        </div>
      );
    }
    if (trimmed.startsWith("- [ ]")) {
      return (
        <div key={line} className="flex items-start gap-2 py-0.5">
          <span className="text-muted-foreground mt-0.5">○</span>
          <span>{parseInline(content)}</span>
        </div>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <div key={line} className="flex items-start gap-2 py-0.5 pl-2">
          <span className="text-muted-foreground mt-1.5">•</span>
          <span>{parseInline(content)}</span>
        </div>
      );
    }
    return (
      <div key={line} className="flex items-start gap-2 py-0.5 pl-4">
        <span className="text-muted-foreground">{listMatch[1]}</span>
        <span>{parseInline(content)}</span>
      </div>
    );
  }

  const tableMatch = trimmed.match(/^\|.*\|$/);
  if (tableMatch) {
    return null;
  }

  if (trimmed === "") {
    return <div key={line} className="h-2" />;
  }

  return (
    <p key={line} className="text-[14px] leading-relaxed text-foreground/85 py-0.5">
      {parseInline(trimmed)}
    </p>
  );
}

export function Markdown({ content }: MarkdownProps) {
  const parts = extractCodeBlocks(content);
  const elements: ReactNode[] = [];

  parts.forEach((part, i) => {
    if (part.type === "code") {
      elements.push(
        <CodeBlockInline key={`code-${i}`} code={part.content} lang={part.lang} />
      );
    } else {
      const lines = part.content.split("\n");
      lines.forEach((line) => {
        const parsed = parseLine(line);
        if (parsed !== null) {
          elements.push(parsed);
        }
      });
    }
  });

  return <div className="flex flex-col">{elements}</div>;
}

function CodeBlockInline({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40">
        <span className="text-[11px] text-muted-foreground font-mono">{lang || "code"}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-[13px] font-mono text-foreground/90 leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}
