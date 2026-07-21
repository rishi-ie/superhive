import * as React from 'react'
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds'
import type { ContentPart } from '@/models/runtime'
import type { ToolCallCardBaseProps, ToolCallCardSlots } from '@/models/page'

export type { ToolCallCardBaseProps, ToolCallCardSlots }

function stateBackgroundClass(
  state: 'pending' | 'streaming-args' | 'running' | 'complete',
  isError: boolean,
): string {
  if (isError) return 'bg-chat-bubble-tool-bg-error'
  if (state === 'complete') return 'bg-chat-bubble-tool-bg-success'
  if (state === 'running' || state === 'streaming-args') return 'bg-chat-bubble-tool-bg-running'
  return 'bg-chat-bubble-tool-bg-pending'
}

/** Status dot color: maps state to a semantic fg token. */
function statusDotClass(
  state: 'pending' | 'streaming-args' | 'running' | 'complete',
  isError: boolean,
): string {
  if (isError) return 'bg-chat-status-error'
  if (state === 'complete') return 'bg-chat-status-success'
  if (state === 'running' || state === 'streaming-args') return 'bg-chat-status-running'
  return 'bg-muted-foreground/60'
}

interface ToolCallCardProps {
  slots: ToolCallCardSlots
  state: 'pending' | 'streaming-args' | 'running' | 'complete'
  running?: boolean
  isError?: boolean
}

/**
 * Renders an unknown / extension-registered tool call. Shows the raw JSON for
 * `args` and the result so the user can still inspect what the agent did.
 */
export function renderGenericToolBody(
  args: unknown,
  result?: Extract<ContentPart, { type: 'tool-result' }>,
): React.ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <details>
        <summary className="text-[11px] text-muted-foreground cursor-pointer">
          args
        </summary>
        <pre className="font-mono text-[11px] bg-background/50 rounded-sm p-2 overflow-x-auto">
          {JSON.stringify(args, null, 2)}
        </pre>
      </details>
      {result ? (
        <details>
          <summary className="text-[11px] text-muted-foreground cursor-pointer">
            result
          </summary>
          <pre className="font-mono text-[11px] bg-background/50 rounded-sm p-2 overflow-x-auto max-h-[300px] overflow-y-auto">
            {JSON.stringify(result.result, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  )
}

export function ToolCallCard({
  slots,
  state,
  running: runningProp,
  isError = false,
}: ToolCallCardProps) {
  const bg = stateBackgroundClass(state, isError)
  const dotFg = statusDotClass(state, isError)
  const running = runningProp ?? (state === 'running' || state === 'streaming-args')
  const elapsed = useElapsedSeconds(running)
  const detailsRef = React.useRef<HTMLDetailsElement | null>(null)

  // Auto-expand running, auto-collapse completed after 2s (P14.3.1/2).
  // The user can re-open manually after the auto-collapse; we don't force
  // anything beyond the post-completion 2s window.
  React.useEffect(() => {
    const el = detailsRef.current
    if (!el) return
    if (running) {
      el.open = true
      return
    }
    if (state === 'complete' || isError) {
      const t = setTimeout(() => {
        if (detailsRef.current) detailsRef.current.open = false
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [running, state, isError])

  return (
    <details
      ref={detailsRef}
      open={running}
      className={`rounded-chat-tool-card border border-border overflow-hidden ${bg}`}
    >
      <summary className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer list-none">
        <span className={`size-1.5 rounded-full ${dotFg}`} aria-hidden />
        {slots.header}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {elapsed > 0 ? `${elapsed}s` : ''}
        </span>
      </summary>
      <div className="px-3 py-2 text-xs">{slots.body}</div>
      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        state={state} {isError ? '· error' : ''}
      </div>
    </details>
  )
}
