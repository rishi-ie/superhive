import * as React from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { getMessageTailFingerprint } from '@/models/runtime';
import { HugeIcon } from '@/components/ui/huge-icon';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ActiveStateBanners } from './ActiveStateBanners';
import { ChatEmptyState } from './SuggestedPrompts';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { RuntimeMessage } from '@/types/electron';

interface ConversationAreaProps {
  messages: RuntimeMessage[];
  busy?: boolean;
  compaction?: import('@/models/runtime').CompactionStatus;
  retry?: import('@/models/runtime').RetryStatus;
  onCancel?: () => void;
  agentId?: string;
  agentName?: string;
  onPromptSelect?: (prompt: string) => void;
}

export function ConversationArea({
  messages,
  busy = false,
  compaction,
  retry,
  onCancel,
  agentId,
  agentName,
  onPromptSelect,
}: ConversationAreaProps) {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);
  const [atBottom, setAtBottom] = React.useState(true);
  const seenIdsRef = React.useRef<Set<string>>(new Set());
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = React.useState(0);

  const lastTailRef = React.useRef('');

  /**
   * Track which message ids are "freshly mounted" so we can play the
   * fade-in animation once per id. The Set is dropped from view shortly after
   * so streaming-tail deltas don't re-trigger.
   */
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

  /**
   * Bump unread count whenever a new message lands while the user is
   * scrolled away from the bottom. Cleared on jump-to-bottom / successful
   * follow-output.
   */
  const lastMessageIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId && lastId !== lastMessageIdRef.current) {
      const isFresh = !seenIdsRef.current.has(lastId) === false
      void isFresh
      if (lastMessageIdRef.current && !atBottom) {
        setUnreadCount((n) => n + 1);
      }
      lastMessageIdRef.current = lastId;
    } else if (!lastId) {
      lastMessageIdRef.current = null;
    }
  }, [messages, atBottom]);

  /**
   * Scroll position tracking — Virtuoso's `atBottomStateChange` is more
   * accurate than scroll-position heuristics (no 80px tolerance hack).
   */
  const onAtBottomChange = React.useCallback((bottom: boolean) => {
    setAtBottom(bottom);
    if (bottom) setUnreadCount(0);
  }, []);

  const scrollToBottom = React.useCallback(() => {
    if (messages.length === 0) return
    virtuosoRef.current?.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
      align: 'end',
    });
  }, [messages.length]);

  /**
   * Busy-edge: when the agent transitions from idle to busy mid-scroll,
   * force stick-to-bottom so the streaming tail is visible immediately.
   */
  React.useEffect(() => {
    if (!busy) return
    if (messages.length === 0) return
    lastTailRef.current = messages[messages.length - 1]?.id ?? ''
    setAtBottom(true)
    setUnreadCount(0)
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
      })
    })
  }, [busy, messages])

  if (messages.length === 0 && !busy) {
    return <ChatEmptyState agentName={agentName} onPromptSelect={onPromptSelect} />;
  }

  // P11.2.4 — wrap the Virtuoso scroll container in a Scroller that keeps
  // the project's `chat-fade-bottom` mask intact (Phase 2.7 token).
  const Scroller = React.useCallback(
    (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props} className={cn(props.className, 'no-scrollbar chat-fade-bottom')} />
    ),
    [],
  )

  // Mark touched messages so fingerprint stays referenced even if unused.
  void getMessageTailFingerprint;
  void lastTailRef;

  return (
    <div
      className="relative flex-1 h-full min-h-0"
      aria-busy={busy}
      aria-live="polite"
      aria-relevant="additions text"
    >
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={messages}
        computeItemKey={(_, m) => m.id}
        followOutput={atBottom ? 'smooth' : false}
        atBottomStateChange={onAtBottomChange}
        initialTopMostItemIndex={Math.max(0, messages.length - 1)}
        components={{ Scroller }}
        itemContent={(_, message) =>
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
        }
      />
      {compaction || retry ? (
        <div className="absolute top-2 inset-x-0 z-10 mx-auto max-w-4xl px-14">
          <ActiveStateBanners compaction={compaction} retry={retry} onCancel={onCancel ?? (() => {})} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={scrollToBottom}
        className={cn(
          'absolute bottom-4 right-4 z-10 rounded-full bg-background border border-border shadow-md p-2 cursor-pointer transition-opacity',
          atBottom ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-150',
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
