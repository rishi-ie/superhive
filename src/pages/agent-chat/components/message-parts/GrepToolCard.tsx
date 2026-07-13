import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

/**
 * Pi's grep result body typically lists one match per line as `path:lineNo:
 * match`. The total count is also separately emitted as `Found N matches`.
 * We count either header to drive the badge.
 */
function matchCount(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): number | null {
  for (const r of result) {
    if (r.type !== 'text') continue
    const header = /found\s+(\d+)\s+match/i.exec(r.text)
    if (header && header[1]) return Number(header[1])
    const lines = r.text.split('\n').filter((l) => /:\d+/.test(l))
    if (lines.length > 0) return lines.length
  }
  return null
}

function resultText(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string {
  return result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
}

interface GrepRow {
  path: string
  lineNo: number | null
  match: string
}

/**
 * Parse each match line of the form `path:lineNo:matched-text` into a
 * clickable row. Lines that don't fit the format fall through to the
 * plain-text fallback below.
 */
function parseGrepRows(text: string): GrepRow[] {
  const rows: GrepRow[] = []
  for (const line of text.split('\n')) {
    const m = /^([^:]+):(\d+):(.*)$/.exec(line)
    if (!m) continue
    rows.push({
      path: m[1] ?? '',
      lineNo: m[2] ? Number(m[2]) : null,
      match: m[3] ?? '',
    })
  }
  return rows
}

function GrepResults({ text }: { text: string }) {
  const rows = parseGrepRows(text)
  if (rows.length === 0) {
    return <pre className="font-mono text-xs whitespace-pre-wrap">{text}</pre>
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {rows.map((row, i) => (
        <li key={i}>
          <a
            href={row.lineNo != null ? `file://${row.path}:${row.lineNo}` : `file://${row.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-xs rounded-sm px-1.5 py-0.5 hover:bg-muted/50"
          >
            <span className="text-muted-foreground">{row.path}</span>
            {row.lineNo != null ? (
              <span className="text-muted-foreground">:{row.lineNo}</span>
            ) : null}
            <span className="text-foreground">:{row.match}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function argsFromToolCall(args: unknown): {
  pattern?: string
  path?: string
  include?: string
} {
  if (!args || typeof args !== 'object') return {}
  const obj = args as Record<string, unknown>
  return {
    pattern: typeof obj.pattern === 'string' ? obj.pattern : undefined,
    path:
      typeof obj.path === 'string'
        ? obj.path
        : typeof obj.include === 'string'
          ? obj.include
          : undefined,
    include: typeof obj.include === 'string' ? obj.include : undefined,
  }
}

export function GrepToolCard({ part, result }: ToolCallCardBaseProps) {
  const { pattern, path } = argsFromToolCall(part.args)
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-mono text-xs flex items-center gap-1.5">
            grep{' '}
            <span className="font-semibold text-foreground">
              /{pattern ?? ''}/
            </span>
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
            {matchCount(result.result) ? (
              <span className="text-[11px] text-muted-foreground self-start bg-muted/50 rounded-sm px-1.5">
                {matchCount(result.result)} matches
              </span>
            ) : null}
            <GrepResults text={resultText(result.result)} />
          </div>
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}
