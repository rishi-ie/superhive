import { ConversationArea } from '@/pages/agent-chat/components/ConversationArea';
import type { RuntimeMessage } from '@/types/electron';

interface ProjectChatConversationProps {
  messages: RuntimeMessage[];
  projectAgentName: string;
}

export function ProjectChatConversation({ messages }: ProjectChatConversationProps) {
  return <ConversationArea messages={messages} />;
}