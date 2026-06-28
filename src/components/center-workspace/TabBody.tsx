/**
 * Dispatches to the correct view based on tab type.
 */
import { ChatView } from './ChatView';
import { ProjectsView } from './ProjectsView';
import { ProjectDetailView } from './ProjectDetailView';
import { TicketsView } from './TicketsView';
import { AgentsView } from './AgentsView';
import { CommunicationsView } from './CommunicationsView';
import { UniversalProjectsView } from './UniversalProjectsView';
import { UniversalAgentsView } from './UniversalAgentsView';
import { UniversalChannelsView } from './UniversalChannelsView';
import { ChannelDetailView } from './ChannelDetailView';
import { HomeView } from './HomeView';
import { getProject } from '@/data/projects/store';
import { listWorkspaces } from '@/data/workspaces/store';
import type { CenterTab } from '@/data/tabs/interface';

type TabBodyProps = {
  tab: CenterTab;
  onTicketSelect?: (id: string) => void;
  onAgentSelect?: (id: string) => void;
  onProjectSelect?: (id: string, workspaceId: string) => void;
  onChannelSelect?: (id: string, workspaceId: string) => void;
  onNavItemClick?: (id: string) => void;
  onSend?: (message: string) => void;
  onOpenTickets?: () => void;
  onCreateProject?: () => void;
  onCreateTicket?: () => void;
  onCreateChannel?: () => void;
  onCreateAgent?: () => void;
};

/**
 * @param tab - The active tab to render
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentSelect - Called when an agent is selected
 * @param onProjectSelect - Called when a project is selected
 * @param onChannelSelect - Called when a channel is selected
 * @param onNavItemClick - Called when a nav item is clicked (e.g. section see-more)
 * @param onSend - Called when a chat message is sent
 * @param onOpenTickets - Called when "open tickets" is clicked
 * @param onCreateProject - Called when "New Project" is clicked
 * @param onCreateTicket - Called when "New Ticket" is clicked
 * @param onCreateChannel - Called when "New Channel" is clicked
 * @param onCreateAgent - Called when "New Agent" is clicked
 */
export function TabBody({ tab, onTicketSelect, onAgentSelect, onProjectSelect, onChannelSelect, onNavItemClick, onSend, onOpenTickets, onCreateProject, onCreateTicket, onCreateChannel, onCreateAgent }: TabBodyProps) {
  switch (tab.type) {
    case 'projects':
      return (
        <ProjectsView
          workspaceId={tab.workspaceId}
          onTicketSelect={onTicketSelect}
          onAgentClick={onAgentSelect}
          onChannelClick={onChannelSelect}
          onOpenTickets={onOpenTickets}
        />
      );

    case 'project': {
      const project = tab.selectedProjectId ? getProject(tab.selectedProjectId) : null;
      return (
        <ProjectDetailView
          project={project}
          onTicketSelect={onTicketSelect}
          onAgentClick={onAgentSelect}
          onChannelClick={onChannelSelect}
          onOpenTickets={onOpenTickets}
        />
      );
    }

    case 'tickets':
      return (
        <TicketsView
          workspaceId={tab.workspaceId}
          selectedTicketId={tab.selectedTicketId ?? undefined}
          onTicketSelect={onTicketSelect}
          onCreateTicket={onCreateTicket}
        />
      );

    case 'channels':
      return (
        <CommunicationsView
          workspaceId={tab.workspaceId}
          onChannelSelect={onChannelSelect ? (id) => onChannelSelect(id, tab.workspaceId) : undefined}
          onCreateChannel={onCreateChannel}
        />
      );

    case 'channel':
      return (
        <ChannelDetailView
          channelId={tab.selectedChannelId ?? ''}
          workspaceId={tab.workspaceId}
          onTicketClick={onTicketSelect}
          onAgentSelect={onAgentSelect}
        />
      );

    case 'home': {
      const workspaces = listWorkspaces();
      const workspaceName = workspaces.find(w => w.id === tab.workspaceId)?.name ?? tab.workspaceId;
      return (
        <HomeView
          workspaceId={tab.workspaceId}
          workspaceName={workspaceName}
          onProjectSelect={onProjectSelect}
          onAgentSelect={onAgentSelect}
          onChannelSelect={onChannelSelect}
          onTicketSelect={onTicketSelect}
          onNavItemClick={onNavItemClick}
          onCreateProject={onCreateProject}
          onCreateAgent={onCreateAgent}
        />
      );
    }

    case 'agents':
      return (
        <AgentsView
          workspaceId={tab.workspaceId}
          onAgentSelect={onAgentSelect}
          selectedAgentId={tab.selectedAgentId ?? undefined}
        />
      );

    case 'agent':
      return (
        <ChatView
          workspaceId={tab.workspaceId}
          agentId={tab.selectedAgentId ?? undefined}
          onSend={onSend}
        />
      );

    case 'universal-agents':
      return (
        <UniversalAgentsView
          onAgentSelect={onAgentSelect}
          selectedAgentId={tab.selectedAgentId ?? undefined}
          onCreateAgent={onCreateAgent}
        />
      );

    case 'universal-projects':
      return (
        <UniversalProjectsView
          onProjectSelect={onProjectSelect}
          selectedProjectId={tab.selectedProjectId ?? undefined}
          onCreateProject={onCreateProject}
        />
      );

    case 'universal-channels':
      return (
        <UniversalChannelsView
          onChannelSelect={onChannelSelect}
          selectedChannelId={tab.selectedChannelId ?? undefined}
          onCreateChannel={onCreateChannel}
        />
      );

    default:
      return null;
  }
}
