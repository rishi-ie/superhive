import { useEffect, useRef } from 'react';
import type { ChatThread, Message } from '@/data/chat/store';
import { ChatMessage } from './ChatMessage';

type ChatThreadProps = {
  thread: ChatThread;
  agentName?: string;
  agentInitials?: string;
  onRegenerate?: (messageId: string) => void;
  empty?: React.ReactNode;
};

function groupMessagesByDay(messages: Message[]): Array<{ label: string; messages: Message[] }> {
  const groups: Array<{ label: string; messages: Message[] }> = [];
  const dayMap = new Map<string, Message[]>();

  for (const msg of messages) {
    const date = new Date(msg.timestamp);
    const label = date.toDateString() === new Date().toDateString()
      ? 'Today'
      : date.toDateString() === new Date(Date.now() - 86400000).toDateString()
      ? 'Yesterday'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dayMap.has(label)) dayMap.set(label, []);
    dayMap.get(label)!.push(msg);
  }

  return Array.from(dayMap.entries()).map(([label, msgs]) => ({ label, messages: msgs }));
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-4 px-2">
      <span className="flex-1 h-px bg-border/30" />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{label}</span>
      <span className="flex-1 h-px bg-border/30" />
    </div>
  );
}

export function ChatThread({ thread, agentName, agentInitials, onRegenerate, empty }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length]);

  const groups = groupMessagesByDay(thread.messages);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {thread.messages.length === 0 && empty}
      {groups.map(group => (
        <div key={group.label}>
          <DaySeparator label={group.label} />
          <div className="space-y-4">
            {group.messages.map((message, i) => (
              <ChatMessage
                key={message.id}
                message={message}
                agentName={agentName}
                agentInitials={agentInitials}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
