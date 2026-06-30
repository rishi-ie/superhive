/**
 * HomeActivityRow — compact single-line activity event row.
 * 28px tall. Left pip · actor · message · time.
 */
import {
  PlayCircle,
  Loader2,
  Clock,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Eye,
  CheckCircle2,
  ShieldAlert,
  GitMerge,
  HelpCircle,
  MessageCircleMore,
  ArrowRightLeft,
} from 'lucide-react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Avatar } from '@/components/ui/Avatar';
import { STROKE_WIDTH } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/relative-time';
import type { ActivityEvent, ActivityKind } from '@/data/activity/store';

/* ─── Kind metadata ──────────────────────────────────────────────────── */

const KIND_META: Record<ActivityKind, { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; tone: string; label: string }> = {
  agent_executing:     { icon: PlayCircle,          tone: 'chart-2', label: 'exec'  },
  agent_compiling:     { icon: Loader2,           tone: 'chart-3', label: 'comp'  },
  agent_awaiting_human:{ icon: Clock,             tone: 'chart-1', label: 'await' },
  agent_error_loop:    { icon: AlertTriangle,     tone: 'chart-5', label: 'error' },
  agent_idle:          { icon: MinusCircle,       tone: 'muted-foreground', label: 'idle'  },
  ticket_created:      { icon: PlusCircle,         tone: 'chart-1', label: '+'     },
  ticket_executing:    { icon: PlayCircle,         tone: 'chart-2', label: '▶'     },
  ticket_review:       { icon: Eye,                tone: 'chart-3', label: 'review' },
  ticket_merged:       { icon: CheckCircle2,       tone: 'chart-4', label: '✓'     },
  audit_auth:          { icon: ShieldAlert,         tone: 'chart-1', label: 'auth'   },
  audit_diff:          { icon: GitMerge,             tone: 'chart-2', label: 'diff'   },
  question_pending:    { icon: HelpCircle,           tone: 'chart-3', label: '?'      },
  channel_message:     { icon: MessageCircleMore,    tone: 'chart-4', label: 'msg'    },
  swarm_handoff:       { icon: ArrowRightLeft,       tone: 'chart-2', label: '→'     },
};

const KIND_PIP_COLOR: Record<ActivityKind, string> = {
  agent_executing:     'bg-chart-2',
  agent_compiling:     'bg-chart-3',
  agent_awaiting_human:'bg-chart-1',
  agent_error_loop:    'bg-chart-5',
  agent_idle:          'bg-muted-foreground/40',
  ticket_created:      'bg-chart-1',
  ticket_executing:    'bg-chart-2',
  ticket_review:       'bg-chart-3',
  ticket_merged:       'bg-chart-4',
  audit_auth:          'bg-chart-1',
  audit_diff:          'bg-chart-2',
  question_pending:    'bg-chart-3',
  channel_message:     'bg-chart-4',
  swarm_handoff:       'bg-chart-2',
};

function kindToAgentStatus(kind: ActivityKind): import('@/data/agents/interface').AgentStatus | null {
  if (kind === 'agent_executing') return 'EXECUTING';
  if (kind === 'agent_compiling') return 'COMPILING';
  if (kind === 'agent_awaiting_human') return 'AWAITING_HUMAN';
  if (kind === 'agent_error_loop') return 'ERROR_LOOP';
  if (kind === 'agent_idle') return 'IDLE';
  return null;
}

/* ─── Component ─────────────────────────────────────────────────────── */

type HomeActivityRowProps = {
  event: ActivityEvent;
  onAgentClick?: (id: string) => void;
  onTicketClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
};

/**
 * Compact single-line activity row — 28px tall.
 * Left pip · actor · message truncated · time.
 * @param event - The activity event to render
 * @param onAgentClick - Navigate to agent
 * @param onTicketClick - Navigate to ticket
 * @param onChannelClick - Navigate to channel
 */
export function HomeActivityRow({ event, onAgentClick, onTicketClick, onChannelClick }: HomeActivityRowProps) {
  const agentStatus = kindToAgentStatus(event.kind);
  const isAgent = agentStatus !== null;
  const meta = KIND_META[event.kind];
  const Icon = meta.icon;

  const handleClick = () => {
    if (!event.ref) return;
    switch (event.ref.type) {
      case 'agent':
        if (event.actorId && onAgentClick) onAgentClick(event.actorId);
        break;
      case 'ticket':
        if (onTicketClick) onTicketClick(event.ref.id);
        break;
      case 'channel':
        if (onChannelClick && event.ref.workspaceId) {
          onChannelClick(event.ref.id, event.ref.workspaceId);
        }
        break;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!event.ref}
      className="group w-full flex items-center gap-2 h-7 px-2 rounded-sm text-left hover:bg-hover-tint transition-colors disabled:cursor-default disabled:hover:bg-transparent"
    >
      {/* Status pip — 3px vertical bar */}
      <span className={`shrink-0 w-px h-4 rounded-full ${KIND_PIP_COLOR[event.kind]}`} />

      {/* Agent avatar + dot, or icon */}
      <span className="shrink-0">
        {isAgent ? (
          <div className="relative">
            <Avatar size="xs" name={event.actor} fallback={event.actor.slice(0, 2).toUpperCase()} color="bg-chart-1" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusDot status={agentStatus!} size="xs" />
            </div>
          </div>
        ) : (
          <div className={`size-4 rounded-full flex items-center justify-center bg-${meta.tone}/10`}>
            <Icon size={10} strokeWidth={STROKE_WIDTH} className={`text-${meta.tone}`} />
          </div>
        )}
      </span>

      {/* Actor */}
      <span className="shrink-0 text-[11px] font-medium text-foreground tabular-nums">
        {event.actor.split(' ')[0]}
      </span>

      {/* Verb dot */}
      <span className="shrink-0 text-[10px] text-muted-foreground/40">·</span>

      {/* Message */}
      <span className="flex-1 text-[11px] text-muted-foreground truncate">
        {event.message}
      </span>

      {/* Time */}
      <span className="shrink-0 text-[10px] text-muted-foreground/40 tabular-nums font-fustat">
        {formatRelativeTime(event.timestamp)}
      </span>
    </button>
  );
}
