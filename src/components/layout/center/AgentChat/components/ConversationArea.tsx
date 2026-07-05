import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_MESSAGES } from "../mock";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

export function ConversationArea() {
  return (
    <ScrollArea className="flex-1 h-full">
      <div className="mx-auto max-w-4xl px-14 py-8 flex flex-col gap-6">
        {MOCK_MESSAGES.map((message) =>
          message.type === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
          )
        )}
      </div>
    </ScrollArea>
  );
}
