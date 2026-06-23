import { OnboardingWizard } from './center-workspace/OnboardingWizard';
import { ProjectsView } from './center-workspace/ProjectsView';
import { TicketsView } from './center-workspace/TicketsView';
import { EmployeesView } from './center-workspace/EmployeesView';
import { CommunicationsView } from './center-workspace/CommunicationsView';
import { HOME_WIZARD_CONFIG } from '@/data/wizard-configs';
import type { OnboardingWizardProps } from './center-workspace/OnboardingWizard';

export type CenterView = 'home' | 'projects' | 'employees' | 'tickets' | 'communications';

type CenterWorkspaceProps = {
  view: CenterView;
  workspaceId: string;
  activeEmployeeId?: string | null;
  onAction?: OnboardingWizardProps['onAction'];
  onTicketSelect?: (id: string) => void;
  onEmployeeSelect?: (id: string) => void;
};

export function CenterWorkspace({ view, workspaceId, activeEmployeeId, onAction, onTicketSelect, onEmployeeSelect }: CenterWorkspaceProps) {
  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      {view === 'home' && <OnboardingWizard config={HOME_WIZARD_CONFIG} onAction={onAction} />}
      {view === 'projects' && <ProjectsView workspaceId={workspaceId} onTicketSelect={onTicketSelect} onAction={onAction} />}
      {view === 'employees' && <EmployeesView onEmployeeSelect={onEmployeeSelect} selectedEmployeeId={activeEmployeeId} />}
      {view === 'tickets' && <TicketsView workspaceId={workspaceId} onTicketSelect={onTicketSelect} />}
      {view === 'communications' && <CommunicationsView workspaceId={workspaceId} />}
    </div>
  );
}
