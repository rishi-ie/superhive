import { ConversationArea } from '@/pages/agent-chat/components/ConversationArea';
import type { ChannelMessage } from '@/types/electron';

interface ProjectChatConversationProps {
  messages: ChannelMessage[];
  projectAgentName: string;
}

export function ProjectChatConversation({ messages, projectAgentName: _projectAgentName }: ProjectChatConversationProps) {
  return (
    <ConversationArea
      messages={messages.map((m) => ({
        id: m.id,
        role: m.senderType === 'user' ? 'user' : 'assistant',
        content: m.content,
        ts: m.timestamp,
      }))}
    />
  );
}