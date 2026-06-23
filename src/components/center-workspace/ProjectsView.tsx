import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import { OnboardingWizard } from './OnboardingWizard';
import { PROJECTS_WIZARD_CONFIG } from '@/data/wizard-configs';
import {
  getProjectTitle,
  listTickets,
  listProjectAgents,
  listChannels,
} from '@/data/projects/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type ProjectsViewProps = {
  workspaceId: string;
  onTicketSelect?: (id: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

export function ProjectsView({ workspaceId, onTicketSelect, onAction }: ProjectsViewProps) {
  const title = getProjectTitle(workspaceId);

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
      <ExecutionStream tickets={listTickets(workspaceId)} agents={listProjectAgents(workspaceId)} onTicketSelect={onTicketSelect} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={listProjectAgents(workspaceId)} />
        <Communications channels={listChannels(workspaceId)} agents={listProjectAgents(workspaceId)} />
      </div>
    </div>
  );
}
