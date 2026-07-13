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
            <pre className="font-mono text-xs whitespace-pre-wrap">
              {result
                .result.map((r) => (r.type === 'text' ? r.text : ''))
                .join('')}
            </pre>
          </div>
        ) : null,
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}
