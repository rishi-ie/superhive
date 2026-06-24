import { BarChart3 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { CommunicationChannel, ProjectAgent } from '@/data/projects/store';
import type { Agent } from '@/data/agents/store';
import type { Project } from '@/data/projects/store';
import type { UniversalTicket } from '@/data/tickets/store';
import type { Workspace } from '@/data/workspaces/interface';

type GlobalStatsTabProps = {
  kind: 'channels-list' | 'agents-list' | 'universal-agents' | 'universal-projects';
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
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-foreground">{channels.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-2">{open}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Open</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-3">{awaiting}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Awaiting</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-muted-foreground">{resolved}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Resolved</div>
        </div>
      </div>

      {unread > 0 && (
        <div className="text-[10px] text-chart-1 bg-chart-1/10 rounded px-2 py-1.5">
          {unread} channel{unread !== 1 ? 's' : ''} with unread messages
        </div>
      )}

      {mostActive.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Most Active</span>
          <div className="space-y-0.5">
            {mostActive.map(ch => (
              <button
                key={ch.id}
                onClick={() => onChannelClick?.(ch.id, '')}
                className="w-full text-left p-1.5 rounded border border-border bg-card hover:bg-card/80 transition-colors"
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

function AgentStats({ agents, projectAgents, onAgentClick }: {
  agents: Agent[];
  projectAgents: ProjectAgent[];
  onAgentClick?: GlobalStatsTabProps['onAgentClick'];
}) {
  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  const activeAgents = agents.filter(a => a.status === 'EXECUTING' || a.status === 'COMPILING');

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-foreground">{agents.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-2">{activeAgents.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Active</div>
        </div>
      </div>

      <div className="space-y-0.5">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between p-1.5 rounded border border-border bg-card">
            <span className="text-[10px] text-muted-foreground capitalize">
              {status.replace('_', ' ').toLowerCase()}
            </span>
            <span className="text-[10px] font-fustat font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>

      {activeAgents.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Top Active</span>
          <div className="space-y-0.5">
            {activeAgents.slice(0, 4).map(a => (
              <button
                key={a.id}
                onClick={() => onAgentClick?.(a.id)}
                className="w-full text-left p-1.5 rounded border border-border bg-card hover:bg-card/80 transition-colors"
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

  const workspaceCounts: Record<string, number> = {};
  for (const w of workspaces) {
    workspaceCounts[w.id] = agents.filter(a => {
      const projId = a.id.replace('agent-', 'proj-');
      return projId.includes(w.id) || a.name.toLowerCase().includes(w.id);
    }).length;
  }

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-foreground">{agents.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-2">
            {agents.filter(a => a.status === 'EXECUTING').length}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Executing</div>
        </div>
      </div>

      <div className="border-t border-border pt-2 space-y-1">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">By Status</span>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between p-1.5 rounded border border-border bg-card">
            <span className="text-[10px] text-muted-foreground capitalize">
              {status.replace('_', ' ').toLowerCase()}
            </span>
            <span className="text-[10px] font-fustat font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UniversalProjectStats({ projects, universalTickets, workspaces, onProjectClick }: {
  projects: Project[];
  universalTickets: UniversalTicket[];
  workspaces: Workspace[];
  onProjectClick?: GlobalStatsTabProps['onProjectClick'];
}) {
  const backlog = universalTickets.filter(t => t.status === 'BACKLOG').length;
  const executing = universalTickets.filter(t => t.status === 'EXECUTING').length;
  const review = universalTickets.filter(t => t.status === 'REVIEW').length;
  const merged = universalTickets.filter(t => t.status === 'MERGED').length;

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-foreground">{projects.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Projects</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-2">{executing}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Executing</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-3">{review}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Review</div>
        </div>
        <div className="p-2 rounded-md border border-border bg-card">
          <div className="text-lg font-fustat font-bold text-chart-2">{merged}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Merged</div>
        </div>
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
      return (
        <AgentStats
          agents={props.agents}
          projectAgents={props.projectAgents ?? []}
          onAgentClick={props.onAgentClick}
        />
      );
    case 'universal-agents':
      if (!props.agents || !props.workspaces) return <div className="p-3 text-xs text-muted-foreground">No data</div>;
      return (
        <UniversalAgentStats
          agents={props.agents}
          workspaces={props.workspaces}
          onAgentClick={props.onAgentClick}
        />
      );
    case 'universal-projects':
      if (!props.projects || !props.universalTickets || !props.workspaces) return <div className="p-3 text-xs text-muted-foreground">No data</div>;
      return (
        <UniversalProjectStats
          projects={props.projects}
          universalTickets={props.universalTickets}
          workspaces={props.workspaces}
          onProjectClick={props.onProjectClick}
        />
      );
    default:
      return <div className="p-3 text-xs text-muted-foreground">No data available</div>;
  }
}
