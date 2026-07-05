import type { ChatMessage } from "./MessageBubble";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatComposer } from "./ChatComposer";

export type ViewCategory = "agent" | "project" | "hive" | "remote";

const CATEGORY_LABELS: Record<ViewCategory, string> = {
  agent: "Agent view",
  project: "Project view",
  hive: "Meta Hive",
  remote: "Remote",
};

export interface ChatViewProps {
  category: ViewCategory;
  agentName?: string;
}

export function ChatView({ category, agentName }: ChatViewProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader
        categoryLabel={CATEGORY_LABELS[category]}
        agentName={agentName ?? "Untitled"}
        sessionName=""
      />
      <MessageList messages={[] as ChatMessage[]} />
      <ChatComposer model="Composer 2.5 Pro" />
    </div>
  );
}
