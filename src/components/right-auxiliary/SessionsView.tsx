import { listThreads } from '@/data/chat/store';
import type { ChatThread } from '@/data/chat/store';

type SessionsViewProps = {
  onThreadSelect?: (threadId: string) => void;
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ThreadRow({ thread, onClick }: { thread: ChatThread; onClick?: () => void }) {
  const lastMsg = thread.messages[thread.messages.length - 1];
  const initials = lastMsg?.role === 'user'
    ? 'You'
    : lastMsg?.content.slice(0, 2).toUpperCase() ?? '?';

  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full text-left p-2.5 rounded-md border border-border bg-card hover:bg-card/80 transition-colors space-y-1"
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-semibold text-foreground truncate flex-1">{thread.title}</span>
        <span className="text-[9px] text-muted-foreground shrink-0 font-fustat">
          {relativeTime(thread.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="shrink-0">{initials}:</span>
        <span className="truncate flex-1">
          {lastMsg?.content ?? 'No messages'}
        </span>
        <span className="shrink-0">·</span>
        <span className="shrink-0">{thread.messages.length} msgs</span>
      </div>
    </button>
  );
}

export function SessionsView({ onThreadSelect }: SessionsViewProps) {
  const threads = listThreads();

  if (threads.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground/60 italic">No sessions yet. Start a conversation with an agent.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Past Sessions ({threads.length})
      </span>
      <div className="space-y-1.5">
        {threads.map(thread => (
          <ThreadRow
            key={thread.id}
            thread={thread}
            onClick={() => onThreadSelect?.(thread.id)}
          />
        ))}
      </div>
    </div>
  );
}
