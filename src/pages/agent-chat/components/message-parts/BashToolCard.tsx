import { ToolCallCard, type ToolCallCardBaseProps } from './ToolCallCard'

/**
 * Bash tool — renders the command, stdout/stderr, and an exit-code badge.
 * Specialized layout lives here; chrome (background, status dot, duration,
 * collapse-by-default) is owned by `<ToolCallCard>`.
 */
export function BashToolCard({ part, result }: ToolCallCardBaseProps) {
  const command =
    part.args && typeof part.args === 'object' && 'command' in part.args
      ? String((part.args as { command: unknown }).command)
      : ''
  return (
    <ToolCallCard
      slots={{
        header: (
          <span className="font-semibold font-mono">$ {command}</span>
        ),
        body: (
          <div>
            {result ? (
              <div className="flex items-start gap-2">
                <pre className="font-mono text-xs whitespace-pre-wrap mt-0 max-h-[300px] overflow-y-auto flex-1">
                  {resultText(result.result)}
                </pre>
                <BashExitBadge
                  exitCode={resultMeta(result.result).exitCode}
                  isError={result.isError}
                />
              </div>
            ) : null}
            {result && resultMeta(result.result).cancelled ? (
              <span className="text-[10px] text-chat-status-warning ml-1.5">
                (cancelled)
              </span>
            ) : null}
            {result && resultMeta(result.result).timedOut ? (
              <span className="text-[10px] text-chat-status-warning ml-1.5">
                (timed out)
              </span>
            ) : null}
          </div>
        ),
      }}
      state={part.state}
      isError={result?.isError}
    />
  )
}

function resultText(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): string {
  return result
    .map((r) => (r.type === 'text' ? r.text : ''))
    .join('')
}

interface BashResultMeta {
  exitCode?: number
  cancelled?: boolean
  timedOut?: boolean
}

function resultMeta(
  result: ReadonlyArray<import('@/models/runtime').ToolResultContent>,
): BashResultMeta {
  for (const r of result) {
    if (r.type !== 'text') continue
    const cancelled = /\bcancelled\b|\baborted\b/i.test(r.text)
    const timedOut = /\btimed?\s*out\b|\btimeout\b/i.test(r.text)
    const m = /\bexit(?:_|\s)?code[:= ](\d+)/.exec(r.text)
    if (cancelled || timedOut || m?.[1]) {
      return {
        exitCode: m && m[1] ? Number(m[1]) : undefined,
        cancelled: cancelled || undefined,
        timedOut: timedOut || undefined,
      }
    }
  }
  return {}
}

function BashExitBadge({ exitCode, isError }: { exitCode?: number; isError?: boolean }) {
  if (typeof exitCode === 'number' && exitCode !== 0) {
    return (
      <span className="bg-destructive text-destructive-foreground rounded-sm px-1.5 text-[10px] font-mono">
        exit {exitCode}
      </span>
    )
  }
  if (isError) {
    return (
      <span className="bg-destructive text-destructive-foreground rounded-sm px-1.5 text-[10px]">
        failed
      </span>
    )
  }
  return (
    <span className="bg-success/30 text-success-foreground rounded-sm px-1.5 text-[10px]">
      ok
    </span>
  )
}
