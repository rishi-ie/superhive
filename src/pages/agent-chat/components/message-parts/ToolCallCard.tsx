import * as React from 'react'
import type { ContentPart } from '@/models/runtime'

export interface ToolCallCardBaseProps {
  part: Extract<ContentPart, { type: 'tool-call' }>
  result?: Extract<ContentPart, { type: 'tool-result' }>
}

/** Header is rendered by each tool-specific subclass. Body content goes
 *  through `<CollapsibleContent>`. The base owns the chrome — token-driven
 *  background, status dot, duration timer, collapse-by-default behavior. */
export interface ToolCallCardSlots {
  header: React.ReactNode
  body: React.ReactNode
}

/**
 * Track elapsed seconds since the tool call started. Stops counting once
 * `running` flips to false so the displayed duration freezes at the
 * completion moment. Used by every tool-specific header.
 */
export function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = React.useState(0)
  const startedAt = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (!running) return
    if (startedAt.current == null) startedAt.current = Date.now()
    const id = setInterval(() => {
      if (startedAt.current != null) {
        setSeconds(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])
  return seconds
}

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

export function ToolCallCard({ slots, state, isError = false }: ToolCallCardProps) {
  const bg = stateBackgroundClass(state, isError)
  const dotFg = statusDotClass(state, isError)
  const running = state === 'running' || state === 'streaming-args'
  const elapsed = useElapsedSeconds(running)
  // Running: keep the body open so the user can watch the trace.
  // Done: collapse to a one-line header so the conversation stays compact.
  return (
    <details
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
