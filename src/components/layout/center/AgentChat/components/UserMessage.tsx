import type { Message } from "../mock";
import { Copy, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="group relative w-full py-2">
      <div className="w-fit ml-auto rounded-lg bg-sidebar px-3 py-2">
        <p className="text-[14px] leading-relaxed text-foreground/90">{message.content}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 justify-end">
        <span className="text-[11px] text-muted-foreground mr-1">{message.timestamp}</span>
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <Copy className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7 border-0">
          <PenLine className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
