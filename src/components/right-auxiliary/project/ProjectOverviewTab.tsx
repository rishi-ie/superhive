/**
 * Project overview tab — title, stats, contributors, activity, and top tickets/channels previews.
 */
import type { Project } from '@/data/projects/store';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { SectionLabel } from '@/components/ui/SectionLabel';

type ProjectOverviewTabProps = {
  project: Project;
  onTicketClick?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  TODO:      'bg-secondary/40 text-muted-foreground',
  EXECUTING: 'bg-chart-2/15 text-chart-2 border-chart-2/40',
  DONE:      'bg-muted/20 text-muted-foreground border-muted-foreground/40',
};

/**
 * Project overview tab — title, stats, contributors, activity, and top tickets/channels previews.
 * @param project - Project to display
 * @param onTicketClick - Called when a ticket is clicked
 * @param onAgentClick - Called when an agent is clicked
 * @param onChannelClick - Called when a channel is clicked
 */
export function ProjectOverviewTab({ project, onTicketClick, onAgentClick, onChannelClick }: ProjectOverviewTabProps) {
  const executing = project.tickets.filter(t => t.status === 'EXECUTING').length;
  const activeAgents = project.agents.filter(a => a.currentStatus === 'WORKING' || a.currentStatus === 'COMPILING').length;
  const openChannels = project.channels.filter(c => c.status !== 'RESOLVED').length;
  const lastActivity = project.activity[0];

  const topAgents = project.agents.slice(0, 3);
  const recentActivity = project.activity.slice(0, 5);

  const backlog = project.tickets.filter(t => t.status === 'TODO').length;
  const done = project.tickets.filter(t => t.status === 'DONE').length;

  const topTickets = [...project.tickets]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 3);

  const topChannels = [...project.channels]
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 3);

  return (
    <div className="p-3 space-y-4">

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{project.title}</h2>
        <p className="text-xs text-muted-foreground">{project.workspaceId}</p>
        {lastActivity && (
          <p className="text-[10px] text-muted-foreground">Last activity {lastActivity.timestamp}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Tickets" value={project.tickets.length} />
        <StatCard label="Executing" value={executing} color="text-chart-3" />
        <StatCard label="Active Agents" value={activeAgents} color="text-chart-2" />
        <StatCard label="Open Channels" value={openChannels} />
      </div>

      {/* Mini breakdown */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-3">
        <span>Backlog {backlog}</span>
        <span>·</span>
        <span>Executing {executing}</span>
        <span>·</span>
        <span>Done {done}</span>
      </div>

      {/* Contributors */}
      {topAgents.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Contributors</SectionLabel>
          <div className="space-y-1">
            {topAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-2 group cursor-pointer">
                <button
                  onClick={() => onAgentClick?.(agent.id)}
                  className="shrink-0"
                >
                  <Avatar size="xs2" name={agent.name} color="bg-chart-2" />
                </button>
                <button
                  onClick={() => onAgentClick?.(agent.id)}
                  className="text-[10px] text-muted-foreground truncate hover:text-foreground transition-colors flex-1"
                >
                  {agent.name}
                </button>
                <span className="text-[9px] text-muted-foreground/60 shrink-0">{agent.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Recent Activity</SectionLabel>
          <div className="space-y-1">
            {recentActivity.map(item => {
              const agent = project.agents.find(a => a.name === item.primaryAgent);
              return (
                <div key={item.id} className="flex items-start gap-1.5 text-[10px]">
                  <span className="text-muted-foreground/60 shrink-0 font-fustat">{item.timestamp}</span>
                  <span className="text-muted-foreground/60 shrink-0">·</span>
                  <span className="text-muted-foreground/60 shrink-0">{agent?.initials ?? '?'}</span>
                  <span className="text-muted-foreground/80 truncate flex-1">{item.action}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Active Tickets */}
      {topTickets.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Active Tickets</SectionLabel>
          <div className="space-y-1">
            {topTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onTicketClick?.(ticket.id)}
                className="w-full flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors text-left"
              >
                <span className="text-[9px] font-fustat text-muted-foreground shrink-0">{ticket.id}</span>
                <span className="text-[10px] text-foreground truncate flex-1">{ticket.title}</span>
                <span className={`text-[9px] font-medium uppercase tracking-wider rounded border px-1 py-0.5 shrink-0 ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Active Channels */}
      {topChannels.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Active Channels</SectionLabel>
          <div className="space-y-1">
            {topChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => onChannelClick?.(channel.id, project.workspaceId)}
                className="w-full flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors text-left"
              >
                <span className="text-[10px] text-foreground truncate flex-1">{channel.topic}</span>
                <span className="text-[9px] text-muted-foreground shrink-0">{channel.messageCount} msgs</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
