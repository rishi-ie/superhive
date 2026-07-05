import { Plus, Send } from "lucide-react";
import { ConversationArea } from "./components/ConversationArea";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AgentChatView() {
  return (
    <div className="flex flex-col h-full">
      <ConversationArea />
      <div className="shrink-0">
        <div className="max-w-4xl mx-auto px-14 py-4">
          <div className="rounded-2xl bg-sidebar-accent">
            <Textarea
              placeholder="Ask your digital employee…"
              className="!bg-transparent min-h-0 w-full rounded-2xl px-4 py-4 text-[20px] leading-normal text-foreground/90 placeholder:text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none"
              rows={1}
            />
            <div className="flex items-center justify-between px-3 pb-3 -mt-1">
              <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 w-8 border-0">
                <Plus className="size-5" />
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 w-8 border-0">
                <Send className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
