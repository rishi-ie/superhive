import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ThinkingPartProps {
  text: string
  isStreaming: boolean
}

export function ThinkingPart({ text }: ThinkingPartProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="cursor-pointer">
        trigger
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="text-sm">{text}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
