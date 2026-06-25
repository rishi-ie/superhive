/**
 * Single thread row — title, last message preview, timestamp.
 */
import type { ChatThread } from '@/data/chat/store';
import { formatRelativeTime } from '@/lib/relative-time';

type ThreadRowProps = {
  thread: ChatThread;
  onClick?: () => void;
};

/**
 * Single thread row — title, last message preview, timestamp.
 * @param thread - Thread data to display
 * @param onClick - Called when row is clicked
 */
export function ThreadRow({ thread, onClick }: ThreadRowProps) {
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
          {formatRelativeTime(thread.updatedAt)}
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
