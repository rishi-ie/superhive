/**
 * Sessions view — lists past chat threads for an agent.
 */
import { listThreads } from '@/data/chat/store';
import { ThreadRow } from './ThreadRow';

type SessionsViewProps = {
  onThreadSelect?: (threadId: string) => void;
};

/**
 * Sessions view — lists past chat threads for an agent.
 * @param onThreadSelect - Called when thread row is clicked
 */
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
