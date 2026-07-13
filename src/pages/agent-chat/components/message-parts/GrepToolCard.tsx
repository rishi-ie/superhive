import * as React from 'react'
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

/**
 * Grep truncation footer — emitted when Pi hits its match-count limit. We
 * surface it as a small warning pill so the user can request a narrower
 * search without being confused by missing results.
 */
function truncationNotice(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string | null {
  for (const r of result) {
    if (r.type !== 'text') continue
    const m = /truncated.*?(\d+)\s+match.*?limit.*?(\d+)/i.exec(r.text)
    if (m && m[1] && m[2]) {
      return `Truncated: ${m[1]} matches, limit ${m[2]}`
    }
    if (/truncated/i.test(r.text)) return 'Truncated'
  }
  return null
}

interface GrepRow {
  path: string
  lineNo: number | null
  match: string
}

/**
 * Build a RegExp from the user's grep pattern. Strings that fail to compile
 * (e.g. literal `[abc` not closed) fall back to `null`, signalling the
 * renderer to skip substring highlighting for that tool call.
 */
function usePatternRegex(pattern: string | undefined): RegExp | null {
  return React.useMemo(() => {
    if (!pattern) return null
    try {
      return new RegExp(pattern, 'gi')
    } catch {
      return null
    }
  }, [pattern])
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

function GrepResults({
  text,
  patternRe,
}: {
  text: string
  patternRe: RegExp | null
}) {
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
            <span className="text-foreground">:</span>
            {patternRe ? highlightMatch(row.match, patternRe) : row.match}
          </a>
        </li>
      ))}
    </ul>
  )
}

function highlightMatch(text: string, re: RegExp) {
  const out: React.ReactNode[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while ((m = re.exec(text)) != null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index))
    out.push(
      <span key={m.index} className="font-semibold text-foreground">
        {m[0]}
      </span>,
    )
    lastIndex = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex))
  return out
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
  const patternRe = usePatternRegex(pattern)
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
            <GrepResults text={resultText(result.result)} patternRe={patternRe} />
            {truncationNotice(result.result) ? (
              <div className="text-[11px] text-chat-status-warning mt-1">
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
