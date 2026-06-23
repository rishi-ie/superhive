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

export function ProjectsView({ onAction }: { onAction?: OnboardingWizardProps['onAction'] }) {
  if (!getProjectTitle()) {
    return (
      <OnboardingWizard
        config={PROJECTS_WIZARD_CONFIG}
        onAction={onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{getProjectTitle()}</h1>
      <ExecutionStream tickets={listTickets()} agents={listProjectAgents()} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={listProjectAgents()} />
        <Communications channels={listChannels()} agents={listProjectAgents()} />
      </div>
    </div>
  );
}
