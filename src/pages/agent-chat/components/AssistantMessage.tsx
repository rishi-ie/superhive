import { Icon } from "@/components/ui/icon";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button';
import { getMessageText } from '@/models/runtime';
import { ThinkingPart } from './message-parts/ThinkingPart';
import type { RuntimeMessage } from '@/types/electron';

interface AssistantMessageProps {
  message: RuntimeMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const text = getMessageText(message);
  const last = message.parts[message.parts.length - 1];
  const isStreaming = !!last && last.type === 'text' && last.state === 'streaming';
  const thinkingParts = message.parts.filter((p) => p.type === 'thinking');
  return (
    <div className="group relative w-full py-button-y flex flex-col gap-2">
      {thinkingParts.map((part, i) => {
        if (part.type !== 'thinking') return null
        const isLast = i === thinkingParts.length - 1
        const streamingNow = isLast && part.state === 'streaming'
        return (
          <ThinkingPart
            key={`thinking-${i}`}
            text={part.text}
            isStreaming={streamingNow}
          />
        )
      })}
      <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
        {text}
        {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-foreground/70 animate-pulse" />}
      </p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
        </Button>
        <span className="text-[11px] text-muted-foreground ml-1">
          {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}