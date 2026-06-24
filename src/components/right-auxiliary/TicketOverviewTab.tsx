import { nameToAgentId } from '@/data/agents/store';
import type { UniversalTicket } from '@/data/tickets/store';
import type { SwarmActivity, ProjectAgent } from '@/data/projects/store';

type TicketOverviewTabProps = {
  ticket: UniversalTicket;
  projectAgents: ProjectAgent[];
  recentActivity: SwarmActivity[];
  onAgentClick?: (id: string) => void;
  onProjectClick?: (projectId: string, workspaceId: string) => void;
  onChannelClick?: (channelId: string, workspaceId: string) => void;
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH:   'bg-chart-5/15 text-chart-5 border-chart-5/40',
  MEDIUM: 'bg-chart-3/15 text-chart-3 border-chart-3/40',
  LOW:    'bg-secondary/40 text-muted-foreground border-border',
};

const TYPE_LABELS: Record<string, string> = {
  BUG: 'Bug',
  FEATURE: 'Feature',
  REFACTOR: 'Refactor',
  INFRA: 'Infra',
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  EXECUTING: 'Executing',
  REVIEW: 'Review',
  MERGED: 'Merged',
};

export function TicketOverviewTab({
  ticket,
  projectAgents,
  recentActivity,
  onAgentClick,
  onProjectClick,
  onChannelClick,
}: TicketOverviewTabProps) {
  const initials = ticket.assignee.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const assigneeId = nameToAgentId(ticket.assignee.name);

  const relatedActivity = recentActivity
    .filter(a => a.context.includes(ticket.id))
    .slice(0, 4);

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-fustat font-bold text-chart-2 bg-chart-2/10 rounded px-1.5 py-0.5">
            {ticket.id}
          </span>
          <span className={`text-[9px] font-medium uppercase tracking-wider rounded border px-1.5 py-0.5 ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className="text-[9px] text-muted-foreground rounded border border-border bg-secondary/40 px-1.5 py-0.5">
            {TYPE_LABELS[ticket.type] ?? ticket.type}
          </span>
          <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            ticket.status === 'EXECUTING' ? 'bg-chart-2/15 text-chart-2 border-chart-2/40' :
            ticket.status === 'REVIEW' ? 'bg-chart-3/15 text-chart-3 border-chart-3/40' :
            'bg-muted/20 text-muted-foreground border-muted-foreground/40'
          }`}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-tight">{ticket.title}</p>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { if (assigneeId && onAgentClick) onAgentClick(assigneeId); }}
            className="size-5 rounded-full bg-chart-2 flex items-center justify-center text-[9px] font-bold text-sidebar-primary-foreground hover:opacity-80 transition-opacity shrink-0"
          >
            {initials}
          </button>
          <button
            onClick={() => { if (assigneeId && onAgentClick) onAgentClick(assigneeId); }}
            className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors"
          >
            {ticket.assignee.name}
          </button>
          {ticket.assignee.isAI && (
            <span className="size-1.5 rounded-full bg-chart-2 pulse-executing shrink-0" />
          )}
        </div>

        <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded px-2 py-1.5">
          Project:{' '}
          <button
            onClick={() => onProjectClick?.(ticket.id, ticket.workspaceId)}
            className="text-foreground hover:text-chart-1 transition-colors"
          >
            {ticket.projectName}
          </button>
        </div>
      </div>

      {relatedActivity.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Activity</span>
          <div className="space-y-1">
            {relatedActivity.map(item => {
              const agent = projectAgents.find(a => a.name === item.primaryAgent);
              const initials = agent?.initials ?? item.primaryAgent.slice(0, 2).toUpperCase();
              return (
                <div key={item.id} className="flex items-start gap-1.5 text-[10px]">
                  <span className="text-muted-foreground/60 shrink-0 font-fustat">{item.timestamp}</span>
                  <span className="text-muted-foreground/60 shrink-0">·</span>
                  <span className="font-semibold text-foreground shrink-0">{initials}</span>
                  <span className="text-muted-foreground/80 truncate flex-1">{item.action}</span>
                  <span className="text-muted-foreground/60 shrink-0">→</span>
                  <span className="text-muted-foreground/60 shrink-0">{item.context}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
