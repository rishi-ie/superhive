import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

function argsFromToolCall(args: unknown): {
  pattern?: string
  path?: string
} {
  if (!args || typeof args !== 'object') return {}
  const obj = args as Record<string, unknown>
  return {
    pattern: typeof obj.pattern === 'string' ? obj.pattern : undefined,
    path: typeof obj.path === 'string' ? obj.path : undefined,
  }
}

export function FindToolCard({ part, result }: ToolCallCardBaseProps) {
  const { pattern, path } = argsFromToolCall(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-mono text-xs flex items-center gap-1.5">
            find{' '}
            <span className="font-semibold text-foreground">{pattern ?? ''}</span>
            {path ? (
              <>
                <span className="text-muted-foreground">in</span>
                <span className="text-muted-foreground truncate">{path}</span>
              </>
            ) : null}
          </span>
        ),
        body: result ? (
          <div className="flex flex-col gap-1.5">
            <FindResults
              text={result
                .result.map((r) => (r.type === 'text' ? r.text : ''))
                .join('')}
            />
            {truncationNotice(result.result) ? (
              <div className="text-[11px] text-chat-status-warning">
                {truncationNotice(result.result)}
              </div>
            ) : null}
          </div>
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

/**
 * Render each path on its own line. Pi's `-type d` results end with `/`; we
 * forward that visually so the user can scan for directories at a glance.
 */
function FindResults({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^Found\s+\d+/i.test(l))
  if (lines.length === 0) {
    return <pre className="font-mono text-xs whitespace-pre-wrap">{text}</pre>
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {lines.map((line, i) => (
        <li key={i}>
          <a
            href={`file://${line}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-xs rounded-sm px-1.5 py-0.5 hover:bg-muted/50"
          >
            {line}
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Detect Pi's "Truncated: …" footer. Shows a warning so the user can
 * tighten the search scope instead of getting a partial result.
 */
function truncationNotice(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string | null {
  for (const r of result) {
    if (r.type !== 'text') continue
    const m = /truncated.*?limit.*?(\d+)/i.exec(r.text)
    if (m && m[1]) return `Truncated: limit ${m[1]}`
    if (/truncated/i.test(r.text)) return 'Truncated'
  }
  return null
}
