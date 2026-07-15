import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds'

interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

export function ThinkingPart({ text, isStreaming }: ThinkingPartProps) {
  const elapsed = useElapsedSeconds(isStreaming)
  const [open, setOpen] = React.useState(isStreaming)
  React.useEffect(() => {
    if (isStreaming) setOpen(true)
    else setOpen(false)
  }, [isStreaming])
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-card px-3 py-2 pl-0">
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs cursor-pointer">
          <span>
            {isStreaming
              ? `Thinking… (${elapsed}s)`
              : 'Thought'}
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
