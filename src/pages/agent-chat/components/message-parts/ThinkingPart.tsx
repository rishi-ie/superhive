import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HugeIcon } from '@/components/ui/huge-icon'
import { AiBrain02Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

/**
 * Track elapsed seconds since the part first appeared in the renderer.
 * Stops counting once `isStreaming` flips to false so the header reads
 * "Thought for Xs" rather than continuing to tick up.
 */
function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = React.useState(0)
  const startedAt = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (!running) return
    if (startedAt.current == null) startedAt.current = Date.now()
    const id = setInterval(() => {
      if (startedAt.current != null) {
        setSeconds(Math.round((Date.now() - startedAt.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])
  return seconds
}

export function ThinkingPart({ text, isStreaming }: ThinkingPartProps) {
  const elapsed = useElapsedSeconds(isStreaming)
  return (
    // Streaming: stay expanded so the user can read the trace as it streams.
    // Done: collapse to a one-line "Thought for Xs" header until the user
    // explicitly opens the block to inspect what the agent was thinking.
    <Collapsible defaultOpen={isStreaming}>
      <div className="rounded-card p-3">
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs cursor-pointer">
          {isStreaming ? (
            <HugeIcon icon={Loading03Icon} className="size-3.5 animate-spin text-chat-status-running" />
          ) : (
            <HugeIcon icon={AiBrain02Icon} className="size-3.5" />
          )}
          <span>
            {isStreaming
              ? `Thinking… (${elapsed}s)`
              : `Thought for ${Math.max(1, elapsed)}s`}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={
              'text-sm leading-relaxed whitespace-pre-wrap mt-2 ' +
              (isStreaming ? 'shimmer ' : 'text-muted-foreground')
            }
          >
            {text}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
