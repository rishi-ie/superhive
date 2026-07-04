import { Plus, Mic, Send, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatComposerProps {
  model?: string;
}

export function ChatComposer({ model }: ChatComposerProps) {
  return (
    <div className="px-4 pb-4">
      <Card className="relative w-full rounded-2xl border border-border bg-card p-1.5">
        <Textarea
          placeholder="Add a message..."
          className="min-h-[44px] resize-none border-0 bg-transparent px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Add attachment</span>
              </TooltipContent>
            </Tooltip>
            {model && (
              <div className="flex items-center gap-1">
                <Bot className="size-2.5 text-muted-foreground/60" />
                <span className="text-[10px] text-muted-foreground/60">{model}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Mic className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Voice input</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full bg-[#2a2a2a] text-muted-foreground hover:bg-[#333333] hover:text-foreground"
                >
                  <Send className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Send message</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </div>
  );
}
