/**
 * Workspace kanban dashboard: execution stream, swarm roster, and communications grid.
 */
import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import { OnboardingWizard } from './OnboardingWizard';
import { PROJECTS_WIZARD_CONFIG } from '@/data/config/wizard-configs';
import {
  getProjectTitle,
  listTickets,
  listProjectAgents,
  listChannels,
} from '@/data/projects/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type ProjectsViewProps = {
  workspaceId: string;
  projectId?: string;
  onTicketSelect?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
  onOpenTickets?: () => void;
  onAction?: OnboardingWizardProps['onAction'];
};

/**
 * @param workspaceId - Current workspace ID
 * @param projectId - Optional selected project ID
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentClick - Called when an agent is clicked
 * @param onChannelClick - Called when a channel is clicked
 * @param onOpenTickets - Called when "open tickets" is clicked
 * @param onAction - Called when an onboarding action is taken
 */
export function ProjectsView({ workspaceId, projectId, onTicketSelect, onAgentClick, onChannelClick, onOpenTickets, onAction }: ProjectsViewProps) {
  const title = projectId ? getProjectTitle(workspaceId) : getProjectTitle(workspaceId);

  if (!title) {
    return (
      <OnboardingWizard
        config={PROJECTS_WIZARD_CONFIG}
        onAction={onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <ExecutionStream tickets={listTickets(workspaceId)} agents={listProjectAgents(workspaceId)} onTicketSelect={onTicketSelect} onOpenTickets={onOpenTickets} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={listProjectAgents(workspaceId)} onAgentClick={onAgentClick} onTicketClick={onTicketSelect} />
        <Communications channels={listChannels(workspaceId)} agents={listProjectAgents(workspaceId)} onChannelClick={onChannelClick} onParticipantClick={onAgentClick} onTicketClick={onTicketSelect} />
      </div>
    </div>
  );
}
