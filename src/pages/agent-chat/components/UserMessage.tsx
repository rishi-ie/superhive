import * as React from 'react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copyText } from '@/flows/ui/copy-text'
import { getMessageText } from '@/models/runtime'
import type { RuntimeMessage } from '@/types/electron'

interface UserMessageProps {
  message: RuntimeMessage
  agentId: string
}

const MAX_COLLAPSED_LINES = 8
const MAX_COLLAPSED_LENGTH = 600

export function UserMessage({ message }: UserMessageProps) {
  const text = getMessageText(message)
  const [expanded, setExpanded] = React.useState(false)

  const lines = text.split('\n')
  const isLong = lines.length > MAX_COLLAPSED_LINES || text.length > MAX_COLLAPSED_LENGTH
  const visibleLines = expanded ? lines : lines.slice(0, MAX_COLLAPSED_LINES)

  React.useEffect(() => {
    setExpanded(false)
  }, [text])

  return (
    <div className="group relative w-full py-button-y flex flex-col items-end">
      <div
        className={cn(
          'w-fit max-w-[80%] rounded-xl bg-sidebar-accent p-3 shadow-sm',
        )}
      >
        {isLong && !expanded ? (
          <div className="relative">
            {visibleLines.map((line, i) => (
              <p key={i} className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                {line}
              </p>
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-[--chat-bubble-user-bg] pointer-events-none" />
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {text}
          </p>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
        <span className="text-[11px] text-muted-foreground mr-1">
          {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
              onClick={() => copyText(text)}
              aria-label="Copy message"
            >
              <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Copy message</TooltipContent>
        </Tooltip>
        {isLong && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-1.5 border-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : `Show all (${lines.length} lines)`}
          </Button>
        )}
      </div>
    </div>
  )
}
