import { STROKE_WIDTH } from '@/lib/constants';
import type { CommunicationChannel, ProjectAgent } from '@/data/projects/store';
import type { Agent } from '@/data/agents/store';
import type { Project } from '@/data/projects/store';
import type { UniversalTicket } from '@/data/tickets/store';
import type { Workspace } from '@/data/workspaces/interface';

type GlobalStatsTabProps = {
  kind: 'channels-list' | 'agents-list' | 'universal-agents' | 'universal-projects' | 'universal-channels';
  workspaceId?: string;
  channels?: CommunicationChannel[];
  agents?: Agent[];
  projectAgents?: ProjectAgent[];
  projects?: Project[];
  universalTickets?: UniversalTicket[];
  workspaces?: Workspace[];
  onChannelClick?: (id: string, workspaceId: string) => void;
  onAgentClick?: (id: string) => void;
  onProjectClick?: (id: string, workspaceId: string) => void;
};

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-2 rounded-md border border-border/40 bg-card">
      <span className={`text-lg font-fustat font-bold ${color ?? 'text-foreground'}`}>{value}</span>
      <span className="text-[10px] tracking-wider font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-wider font-medium text-muted-foreground">{children}</span>
  );
}

function ChannelStats({ channels, onChannelClick }: {
  channels: CommunicationChannel[];
  onChannelClick?: GlobalStatsTabProps['onChannelClick'];
}) {
  const open = channels.filter(c => c.status === 'OPEN').length;
  const awaiting = channels.filter(c => c.status === 'AWAITING_REPLY').length;
  const resolved = channels.filter(c => c.status === 'RESOLVED').length;
  const unread = channels.filter(c => c.unread).length;
  const mostActive = [...channels]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={channels.length} />
        <StatCard label="Open" value={open} color="text-chart-2" />
        <StatCard label="Awaiting" value={awaiting} color="text-chart-3" />
        <StatCard label="Resolved" value={resolved} />
      </div>

      {unread > 0 && (
        <div className="text-[10px] text-chart-1 bg-chart-1/10 rounded px-2 py-1.5">
          {unread} channel{unread !== 1 ? 's' : ''} with unread messages
        </div>
      )}

      {mostActive.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Most Active</SectionLabel>
          <div className="space-y-1">
            {mostActive.map(ch => (
              <button
                key={ch.id}
                onClick={() => onChannelClick?.(ch.id, '')}
                className="w-full text-left p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors"
                type="button"
              >
                <div className="text-[10px] font-medium text-foreground truncate">{ch.topic}</div>
                <div className="text-[9px] text-muted-foreground">{ch.messageCount} msgs · {ch.updatedAt}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentStats({ agents, onAgentClick }: {
  agents: Agent[];
  onAgentClick?: GlobalStatsTabProps['onAgentClick'];
}) {
  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }
  const activeAgents = agents.filter(a => a.status === 'EXECUTING' || a.status === 'COMPILING');

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={agents.length} />
        <StatCard label="Active" value={activeAgents.length} color="text-chart-2" />
      </div>

      <div className="space-y-1">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-card">
            <span className="text-[10px] text-muted-foreground capitalize">
              {status.replace('_', ' ').toLowerCase()}
            </span>
            <span className="text-[10px] font-fustat font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>

      {activeAgents.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Top Active</SectionLabel>
          <div className="space-y-1">
            {activeAgents.slice(0, 4).map(a => (
              <button
                key={a.id}
                onClick={() => onAgentClick?.(a.id)}
                className="w-full text-left p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors"
                type="button"
              >
                <div className="text-[10px] font-medium text-foreground truncate">{a.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{a.activeTask}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UniversalAgentStats({ agents, workspaces, onAgentClick }: {
  agents: Agent[];
  workspaces: Workspace[];
  onAgentClick?: GlobalStatsTabProps['onAgentClick'];
}) {
  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={agents.length} />
        <StatCard label="Executing" value={agents.filter(a => a.status === 'EXECUTING').length} color="text-chart-2" />
      </div>

      <div className="border-t border-border/40 pt-3 space-y-2">
        <SectionLabel>By Status</SectionLabel>
        <div className="space-y-1">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-card">
              <span className="text-[10px] text-muted-foreground capitalize">
                {status.replace('_', ' ').toLowerCase()}
              </span>
              <span className="text-[10px] font-fustat font-bold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UniversalProjectStats({ projects, universalTickets, onProjectClick }: {
  projects: Project[];
  universalTickets: UniversalTicket[];
  onProjectClick?: GlobalStatsTabProps['onProjectClick'];
}) {
  const backlog = universalTickets.filter(t => t.status === 'BACKLOG').length;
  const executing = universalTickets.filter(t => t.status === 'EXECUTING').length;
  const review = universalTickets.filter(t => t.status === 'REVIEW').length;
  const merged = universalTickets.filter(t => t.status === 'MERGED').length;

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Executing" value={executing} color="text-chart-2" />
        <StatCard label="Review" value={review} color="text-chart-3" />
        <StatCard label="Merged" value={merged} />
      </div>

      <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded px-2 py-1.5">
        {backlog} backlog tickets across all workspaces
      </div>
    </div>
  );
}

export function GlobalStatsTab(props: GlobalStatsTabProps) {
  switch (props.kind) {
    case 'channels-list':
      if (!props.channels) return <div className="p-3 text-xs text-muted-foreground">No channel data</div>;
      return <ChannelStats channels={props.channels} onChannelClick={props.onChannelClick} />;
    case 'agents-list':
      if (!props.agents) return <div className="p-3 text-xs text-muted-foreground">No agent data</div>;
      return <AgentStats agents={props.agents} onAgentClick={props.onAgentClick} />;
    case 'universal-agents':
      if (!props.agents || !props.workspaces) return <div className="p-3 text-xs text-muted-foreground">No data</div>;
      return <UniversalAgentStats agents={props.agents} workspaces={props.workspaces} onAgentClick={props.onAgentClick} />;
    case 'universal-projects':
      if (!props.projects || !props.universalTickets || !props.workspaces) return <div className="p-3 text-xs text-muted-foreground">No data</div>;
      return <UniversalProjectStats projects={props.projects} universalTickets={props.universalTickets} onProjectClick={props.onProjectClick} />;
    case 'universal-channels':
      if (!props.channels) return <div className="p-3 text-xs text-muted-foreground">No channel data</div>;
      return <ChannelStats channels={props.channels} onChannelClick={props.onChannelClick} />;
    default:
      return <div className="p-3 text-xs text-muted-foreground">No data available</div>;
  }
}
