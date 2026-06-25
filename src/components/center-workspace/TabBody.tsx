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
import { getProject } from '@/data/projects/store';
import type { CenterTab } from '@/data/tabs/interface';
import type { OnboardingWizardProps } from './OnboardingWizard';

type TabBodyProps = {
  tab: CenterTab;
  onTicketSelect?: (id: string) => void;
  onAgentSelect?: (id: string) => void;
  onProjectSelect?: (id: string, workspaceId: string) => void;
  onChannelSelect?: (id: string, workspaceId: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
  onSend?: (message: string) => void;
  onOpenTickets?: () => void;
};

/**
 * @param tab - The active tab to render
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentSelect - Called when an agent is selected
 * @param onProjectSelect - Called when a project is selected
 * @param onChannelSelect - Called when a channel is selected
 * @param onAction - Called when an onboarding action is taken
 * @param onSend - Called when a chat message is sent
 * @param onOpenTickets - Called when "open tickets" is clicked
 */
export function TabBody({ tab, onTicketSelect, onAgentSelect, onProjectSelect, onChannelSelect, onAction, onSend, onOpenTickets }: TabBodyProps) {
  switch (tab.type) {
    case 'projects':
      return (
        <ProjectsView
          workspaceId={tab.workspaceId}
          onTicketSelect={onTicketSelect}
          onAgentClick={onAgentSelect}
          onChannelClick={onChannelSelect}
          onOpenTickets={onOpenTickets}
          onAction={onAction}
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
          onAction={onAction}
        />
      );
    }

    case 'tickets':
      return (
        <TicketsView
          workspaceId={tab.workspaceId}
          onTicketSelect={onTicketSelect}
        />
      );

    case 'ticket':
      return (
        <TicketsView
          workspaceId={tab.workspaceId}
          selectedTicketId={tab.selectedTicketId ?? undefined}
          onTicketSelect={onTicketSelect}
        />
      );

    case 'channels':
      return (
        <CommunicationsView
          workspaceId={tab.workspaceId}
          onChannelSelect={onChannelSelect ? (id) => onChannelSelect(id, tab.workspaceId) : undefined}
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
          onAction={onAction}
          onSend={onSend}
        />
      );

    case 'universal-agents':
      return (
        <UniversalAgentsView
          onAgentSelect={onAgentSelect}
          selectedAgentId={tab.selectedAgentId ?? undefined}
          onAction={onAction}
        />
      );

    case 'universal-projects':
      return (
        <UniversalProjectsView
          onProjectSelect={onProjectSelect}
          selectedProjectId={tab.selectedProjectId ?? undefined}
          onAction={onAction}
        />
      );

    case 'universal-channels':
      return (
        <UniversalChannelsView
          onChannelSelect={onChannelSelect}
          selectedChannelId={tab.selectedChannelId ?? undefined}
          onAction={onAction}
        />
      );

    default:
      return null;
  }
}
