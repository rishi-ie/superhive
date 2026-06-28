/**
 * Single thread row — compact, information-rich card.
 */
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import type { ChatThread } from '@/data/chat/store';
import { getAgent } from '@/data/agents/store';
import { formatRelativeTime } from '@/lib/relative-time';

type ThreadRowProps = {
  thread: ChatThread;
  onClick?: () => void;
};

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatTokens(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k tok`;
  return `${tokens} tok`;
}

/**
 * Single thread row — compact, information-rich card.
 * @param thread - Thread data to display
 * @param onClick - Called when row is clicked
 */
export function ThreadRow({ thread, onClick }: ThreadRowProps) {
  const agent = thread.agentId ? getAgent(thread.agentId) : null;
  const lastMsg = thread.messages[thread.messages.length - 1];
  const assistantMsg = thread.messages.filter(m => m.role === 'assistant').at(-1);

  const lastMsgPrefix = lastMsg?.role === 'user'
    ? 'You'
    : (agent?.name ?? 'Agent');

  const metaTokens = assistantMsg?.tokenCount;
  const metaDuration = assistantMsg?.durationMs;
  const metaModel = assistantMsg?.model;

  const initials = agent ? agent.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full text-left p-2 rounded-md border border-border bg-card hover:bg-card/80 transition-colors flex items-start gap-2"
    >
      {/* Agent avatar + status dot */}
      <div className="relative shrink-0 mt-0.5">
        <Avatar
          size="xs2"
          fallback={initials}
          name={agent?.name}
        />
        {agent && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusDot status={agent.status} size="xs" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Header: title + time + count */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground truncate flex-1">
            {thread.title}
          </span>
          <span className="text-[9px] text-muted-foreground shrink-0 font-fustat">
            {formatRelativeTime(thread.updatedAt)}
          </span>
          <span className="text-[9px] text-muted-foreground/60 shrink-0">·</span>
          <span className="text-[9px] text-muted-foreground/60 shrink-0 font-fustat">
            {thread.messages.length}
          </span>
        </div>

        {/* Last message preview */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="shrink-0">{lastMsgPrefix}:</span>
          <span className="truncate flex-1">{lastMsg?.content ?? 'No messages'}</span>
        </div>

        {/* Meta: model + tokens + duration */}
        {(metaModel || metaTokens || metaDuration) && (
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 font-fustat">
            {metaModel && <span>{metaModel}</span>}
            {metaModel && metaTokens && <span>·</span>}
            {metaTokens && <span>{formatTokens(metaTokens)}</span>}
            {metaDuration && <span>·</span>}
            {metaDuration && <span>{formatDuration(metaDuration)}</span>}
          </div>
        )}
      </div>
    </button>
  );
}
