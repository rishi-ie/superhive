import type { ContentPart } from '@/models/runtime'

export interface ToolCallCardBaseProps {
  part: Extract<ContentPart, { type: 'tool-call' }>
}

/** Header is rendered by each tool-specific subclass. Body content goes
 *  through `<CollapsibleContent>`. The base owns the chrome — token-driven
 *  background, status dot, duration timer, collapse-by-default behavior. */
export interface ToolCallCardSlots {
  header: React.ReactNode
  body: React.ReactNode
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

interface ToolCallCardProps {
  slots: ToolCallCardSlots
  state: 'pending' | 'streaming-args' | 'running' | 'complete'
  isError?: boolean
}

export function ToolCallCard({ slots, state, isError = false }: ToolCallCardProps) {
  const bg = stateBackgroundClass(state, isError)
  return (
    <div className={`rounded-chat-tool-card border border-border overflow-hidden ${bg}`}>
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        {slots.header}
      </div>
      <div className="px-3 py-2 text-xs">{slots.body}</div>
      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        state={state} {isError ? '· error' : ''}
      </div>
    </div>
  )
}
