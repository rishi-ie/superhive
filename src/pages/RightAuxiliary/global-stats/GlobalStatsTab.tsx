/**
 * Global stats dispatcher — routes to ChannelStats, AgentStats, UniversalAgentStats, or UniversalProjectStats based on kind.
 */
import type { CommunicationChannel, ProjectAgent } from '@/data/project/store';
import type { Agent } from '@/data/agent/store';
import type { Project } from '@/data/project/store';
import type { UniversalTicket } from '@/data/ticket/store';
import type { Workspace } from '@/data/workspace/interface';
import { ChannelStats } from './ChannelStats';
import { AgentStats } from './AgentStats';
import { UniversalAgentStats } from './UniversalAgentStats';
import { UniversalProjectStats } from './UniversalProjectStats';

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

/**
 * Global stats dispatcher — routes to ChannelStats, AgentStats, UniversalAgentStats, or UniversalProjectStats based on kind.
 * @param kind - Stats variant to display
 * @param workspaceId - Optional workspace id for list contexts
 * @param channels - Channel data for channels-list/universal-channels
 * @param agents - Agent data for agents-list/universal-agents
 * @param projectAgents - Project agents for agents-list
 * @param projects - Projects for universal-projects
 * @param universalTickets - Tickets for universal-projects
 * @param workspaces - Workspaces for universal views
 * @param onChannelClick - Called when channel is clicked
 * @param onAgentClick - Called when agent is clicked
 * @param onProjectClick - Called when project is clicked
 */
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
      if (!props.projects || !props.universalTickets) return <div className="p-3 text-xs text-muted-foreground">No data</div>;
      return <UniversalProjectStats projects={props.projects} universalTickets={props.universalTickets} onProjectClick={props.onProjectClick} />;
    case 'universal-channels':
      if (!props.channels) return <div className="p-3 text-xs text-muted-foreground">No channel data</div>;
      return <ChannelStats channels={props.channels} onChannelClick={props.onChannelClick} />;
    default:
      return <div className="p-3 text-xs text-muted-foreground">No data available</div>;
  }
}
