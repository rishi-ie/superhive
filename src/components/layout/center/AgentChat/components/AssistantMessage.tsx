import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamingIndicator } from "./StreamingIndicator";
import { Markdown } from "./Markdown";
import type { Message } from "../mock";

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  if (message.streaming) {
    return (
      <div className="py-3">
        <StreamingIndicator />
      </div>
    );
  }

  return (
    <div className="group relative w-full py-2">
      <Markdown content={message.content} />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <Copy className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <RefreshCw className="size-3.5" />
        </Button>
        <span className="text-[11px] text-muted-foreground ml-1">{message.timestamp}</span>
      </div>
    </div>
  );
}
