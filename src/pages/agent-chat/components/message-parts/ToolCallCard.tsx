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

interface ToolCallCardProps {
  slots: ToolCallCardSlots
  state: 'pending' | 'streaming-args' | 'running' | 'complete'
  isError?: boolean
}

export function ToolCallCard({ slots, state, isError }: ToolCallCardProps) {
  return (
    <div className="rounded-chat-tool-card border border-border overflow-hidden">
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
