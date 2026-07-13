import * as React from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { ThinkingBubble } from './ThinkingBubble';
import type { RuntimeMessage } from '@/types/electron';

interface ConversationAreaProps {
  messages: RuntimeMessage[];
  busy?: boolean;
}

export function ConversationArea({ messages, busy = false }: ConversationAreaProps) {
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = React.useRef(true);

  const onViewportScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  React.useEffect(() => {
    if (!bottomRef.current) return;
    if (!stickToBottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const showThinking =
    busy &&
    (messages.length === 0 || messages[messages.length - 1]?.role === 'user');

  if (messages.length === 0 && !showThinking) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div
      onScroll={onViewportScroll}
      className="flex-1 h-full min-h-0 overflow-y-auto no-scrollbar"
    >
      <div className="mx-auto max-w-4xl px-14 py-8 flex flex-col gap-6">
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
          )
        )}
        {showThinking && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
