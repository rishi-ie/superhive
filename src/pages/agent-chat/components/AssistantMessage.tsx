import { Icon } from "@/components/ui/icon";
import { CopyIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import type { RuntimeMessage } from '@/types/electron';

interface AssistantMessageProps {
  message: RuntimeMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const isStreaming = message.content.length === 0;
  return (
    <div className="group relative w-full py-2">
      <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
        {message.content}
        {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-foreground/70 animate-pulse" />}
      </p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <Icon icon={CopyIcon} className="size-3.5" />
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