/**
 * Single project detail with stats, execution stream, swarm roster, and communications.
 */
import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import { OnboardingWizard } from './OnboardingWizard';
import { PROJECTS_WIZARD_CONFIG } from '@/data/config/wizard-configs';
import type { Project } from '@/data/projects/store';
import type { OnboardingWizardProps } from './OnboardingWizard';
import { StatCard } from '@/components/ui/StatCard';

type ProjectDetailViewProps = {
  project?: Project | null;
  onTicketSelect?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
  onOpenTickets?: () => void;
  onAction?: OnboardingWizardProps['onAction'];
};

/**
 * @param project - Project to display (null shows onboarding)
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentClick - Called when an agent is clicked
 * @param onChannelClick - Called when a channel is clicked
 * @param onOpenTickets - Called when "open tickets" is clicked
 * @param onAction - Called when an onboarding action is taken
 */
export function ProjectDetailView({
  project,
  onTicketSelect,
  onAgentClick,
  onChannelClick,
  onOpenTickets,
  onAction,
}: ProjectDetailViewProps) {
  if (!project) {
    return (
      <OnboardingWizard
        config={PROJECTS_WIZARD_CONFIG}
        onAction={onAction}
      />
    );
  }

  const executing = project.tickets.filter(t => t.status === 'EXECUTING').length;
  const activeAgents = project.agents.filter(a => a.currentStatus === 'WORKING' || a.currentStatus === 'COMPILING').length;
  const openChannels = project.channels.filter(c => c.status === 'OPEN').length;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{project.title}</h1>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Tickets" value={project.tickets.length} />
        <StatCard label="Executing" value={executing} color="text-chart-2" />
        <StatCard label="Active Agents" value={activeAgents} color="text-chart-2" />
        <StatCard label="Open Channels" value={openChannels} />
      </div>

      <ExecutionStream
        tickets={project.tickets}
        agents={project.agents}
        onTicketSelect={onTicketSelect}
        onOpenTickets={onOpenTickets}
      />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster
          agents={project.agents}
          onAgentClick={onAgentClick}
          onTicketClick={onTicketSelect}
        />
        <Communications
          channels={project.channels}
          agents={project.agents}
          onChannelClick={onChannelClick}
          onParticipantClick={onAgentClick}
          onTicketClick={onTicketSelect}
        />
      </div>
    </div>
  );
}
