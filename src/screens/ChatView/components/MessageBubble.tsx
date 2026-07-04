import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ToolCall {
  name: string;
  target?: string;
}

export interface Attachment {
  name: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  name: string;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex max-w-[80%] flex-col",
          isUser && "items-end"
        )}
      >
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.toolCalls.map((tool, i) => (
              <Badge
                key={i}
                variant="outline"
                className="flex items-center gap-1 border-[#333333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <CheckCircle2 className="size-2.5 text-emerald-500" />
                {tool.name}
                {tool.target && (
                  <span className="text-muted-foreground/60">{tool.target}</span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.attachments.map((att, i) => (
              <Badge
                key={i}
                variant="outline"
                className="flex items-center gap-1 border-[#333333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Paperclip className="size-2.5" />
                {att.name}
              </Badge>
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-xs leading-relaxed",
            isUser
              ? "bg-[#2a2a2a] text-foreground"
              : "bg-transparent text-foreground/90"
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="prose prose-xs prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-code:rounded prose-code:bg-[#2a2a2a] prose-code:px-1.5 prose-code:py-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="mt-1 px-3 text-[10px] text-muted-foreground/60">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
