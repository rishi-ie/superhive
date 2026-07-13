import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Brain01Icon } from '@hugeicons/core-free-icons'

interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

export function ThinkingPart({ text }: ThinkingPartProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs cursor-pointer">
        <HugeIcon icon={Brain01Icon} className="size-3.5" />
        <span>Thinking…</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="text-sm">{text}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
