import { ConversationArea } from "./components/ConversationArea";
import { Composer } from "./components/Composer";

export function AgentChatView() {
  return (
    <div className="flex flex-col h-full">
      <ConversationArea />
      <Composer />
    </div>
  );
}
