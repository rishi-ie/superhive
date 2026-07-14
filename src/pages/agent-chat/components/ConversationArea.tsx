import * as React from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { getMessageTailFingerprint } from '@/models/runtime';
import { HugeIcon } from '@/components/ui/huge-icon';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ActiveStateBanners } from './ActiveStateBanners';
import type { RuntimeMessage } from '@/types/electron';

interface ConversationAreaProps {
  messages: RuntimeMessage[];
  busy?: boolean;
  compaction?: import('@/models/runtime').CompactionStatus;
  retry?: import('@/models/runtime').RetryStatus;
  onCancel?: () => void;
  agentId?: string;
}

export function ConversationArea({
  messages,
  busy = false,
  compaction,
  retry,
  onCancel,
  agentId,
}: ConversationAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = React.useRef(true);
  const lastTailRef = React.useRef('');
  const seenIdsRef = React.useRef<Set<string>>(new Set());
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = React.useState(0);

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
      stickToBottomRef.current = true;
      setUnreadCount(0);
    });
  }, []);

  const scrollToBottom = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    if (messages.length === 0) {
      lastTailRef.current = '';
      seenIdsRef.current = new Set();
      setFreshIds(new Set());
      return;
    }
    const last = messages[messages.length - 1];
    const tail = `${last?.id ?? ''}:${getMessageTailFingerprint(last!) ?? ''}:${messages.length}`;
    if (tail === lastTailRef.current) return;
    const isFreshMessage = last && !seenIdsRef.current.has(last.id);
    lastTailRef.current = tail;
    if (!stickToBottomRef.current) {
      if (isFreshMessage) setUnreadCount((n) => n + 1);
      return;
    }
    followEnd();
  }, [messages, followEnd]);

  React.useEffect(() => {
    if (!stickToBottomRef.current) return;
    followEnd();
  }, [busy, followEnd]);

  React.useEffect(() => {
    const currentIds = new Set(messages.map((m) => m.id));
    const next = new Set<string>();
    for (const id of currentIds) {
      if (!seenIdsRef.current.has(id)) next.add(id);
    }
    seenIdsRef.current = currentIds;
    if (next.size === 0) return;
    setFreshIds((prev) => {
      const merged = new Set(prev);
      for (const id of next) merged.add(id);
      return merged;
    });
    const t = setTimeout(() => {
      setFreshIds((prev) => {
        const trimmed = new Set(prev);
        for (const id of next) trimmed.delete(id);
        return trimmed;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [messages]);

  if (messages.length === 0 && !busy) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full min-h-0">
      <div
        ref={viewportRef}
        onScroll={onViewportScroll}
        className="absolute inset-0 overflow-y-auto no-scrollbar chat-fade-bottom"
      >
        <div className="mx-auto max-w-4xl px-14 py-8 flex flex-col gap-6">
          {compaction || retry ? (
            <ActiveStateBanners compaction={compaction} retry={retry} onCancel={onCancel ?? (() => {})} />
          ) : null}
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} agentId={agentId ?? ''} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                agentId={agentId ?? ''}
                className={freshIds.has(message.id) ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200' : undefined}
              />
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <button
        type="button"
        onClick={scrollToBottom}
        className={cn(
          'absolute bottom-4 right-4 z-10 rounded-full bg-background border border-border shadow-md p-2 cursor-pointer transition-opacity',
          stickToBottomRef.current ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-150',
        )}
        title="Jump to latest"
        aria-label="Jump to latest message"
      >
        <HugeIcon icon={ArrowDown01Icon} size={18} className="size-4.5 text-foreground/80" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
