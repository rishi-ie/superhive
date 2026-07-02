/**
 * Chat header showing agent info, status, token count, and cost.
 */
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { STROKE_WIDTH } from '@/lib/constants';
import { getPermissions } from '@/data/agent/store';
import type { Agent } from '@/data/agent/store';

type ChatHeaderProps = {
  agent: Agent | null;
  tokenCount?: number;
  sessionCost?: number;
};

function formatCost(dollars: number): string {
  if (dollars < 0.01) return '$0.00';
  return `$${dollars.toFixed(4)}`;
}

/**
 * @param agent - Agent to display (null for unknown)
 * @param tokenCount - Running token count for session
 * @param sessionCost - Running cost for session
 */
export function ChatHeader({ agent, tokenCount, sessionCost }: ChatHeaderProps) {
  const initials = agent?.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const permissions = agent ? getPermissions(agent.id) : null;
  const modelEngine = permissions?.modelEngine ?? 'Opus 4.8';

  return (
    <div className="shrink-0 border-b border-border/40 bg-sidebar px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Avatar size="sm" fallback={initials} />

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {agent && <StatusDot status={agent.status} />}
            <span className="text-sm font-semibold text-foreground truncate">{agent?.name ?? 'Unknown Agent'}</span>
            {agent?.role && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground truncate">{agent.role}</span>
              </>
            )}
          </div>
          {agent?.activeTask && (
            <span className="text-[10px] text-muted-foreground/60 truncate leading-tight">
              {agent.activeTask}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-fustat text-muted-foreground/60">
            {tokenCount != null && <span>{tokenCount.toLocaleString()} tok</span>}
            {(sessionCost ?? 0) > 0 && tokenCount != null && <span>·</span>}
            {(sessionCost ?? 0) > 0 && (
              <span className="text-foreground/70">{formatCost(sessionCost ?? 0)}</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-hover-tint transition-colors"
          >
            <span>{modelEngine}</span>
            <ChevronDown size={10} strokeWidth={STROKE_WIDTH} />
          </Button>

          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Thread options"
          >
            <MoreHorizontal size={14} strokeWidth={STROKE_WIDTH} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
