import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Brain01Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

export function ThinkingPart({ text, isStreaming }: ThinkingPartProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs cursor-pointer">
        {isStreaming ? (
          <HugeIcon icon={Loading03Icon} className="size-3.5 animate-spin text-chat-status-running" />
        ) : (
          <HugeIcon icon={Brain01Icon} className="size-3.5" />
        )}
        <span>{isStreaming ? 'Thinking…' : `Thought for ${Math.max(1, Math.round(text.length / 200))}s`}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-2">
          {text}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
