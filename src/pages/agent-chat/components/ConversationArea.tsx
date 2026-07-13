import * as React from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { getMessageTailFingerprint } from '@/models/runtime';
import type { RuntimeMessage } from '@/types/electron';

interface ConversationAreaProps {
  messages: RuntimeMessage[];
  busy?: boolean;
}

export function ConversationArea({ messages, busy = false }: ConversationAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = React.useRef(true);
  const lastTailRef = React.useRef('');

  const onViewportScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  const followEnd = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  React.useEffect(() => {
    if (messages.length === 0) {
      lastTailRef.current = '';
      return;
    }
    const last = messages[messages.length - 1];
    const tail = `${last?.id ?? ''}:${getMessageTailFingerprint(last!) ?? ''}:${messages.length}`;
    if (tail === lastTailRef.current) return;
    lastTailRef.current = tail;
    if (!stickToBottomRef.current) return;
    followEnd();
  }, [messages, followEnd]);

  React.useEffect(() => {
    if (!stickToBottomRef.current) return;
    followEnd();
  }, [busy, followEnd]);

  // The legacy ThinkingBubble was a global indicator that lived outside any
  // message. Phase 4.3.3 moves the streaming-thinking affordance inside
  // AssistantMessage (one `<ThinkingPart>` per part), so we no longer need
  // a top-level bubble. P4.3.2 keeps the `busy` flag and scroll listener
  // intact so the empty state still updates as soon as the first message
  // arrives.

  if (messages.length === 0 && !busy) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      onScroll={onViewportScroll}
      className="flex-1 h-full min-h-0 overflow-y-auto no-scrollbar chat-fade-bottom"
    >
      <div className="mx-auto max-w-4xl px-14 py-8 flex flex-col gap-6">
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
          )
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
