import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_MESSAGES } from "../mock";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

export function ConversationArea() {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col gap-6">
        {MOCK_MESSAGES.map((message) =>
          message.type === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
          )
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
