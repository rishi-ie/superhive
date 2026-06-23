import { CenterBreadcrumb } from './center-workspace/CenterBreadcrumb';
import { CenterTabStrip } from './center-workspace/CenterTabStrip';
import { ChatView } from './center-workspace/ChatView';
import { ProjectsView } from './center-workspace/ProjectsView';
import { TicketsView } from './center-workspace/TicketsView';
import { EmployeesView } from './center-workspace/EmployeesView';
import { CommunicationsView } from './center-workspace/CommunicationsView';
import { OnboardingWizard } from './center-workspace/OnboardingWizard';
import { HOME_WIZARD_CONFIG, BLANK_CANVAS_WIZARD_CONFIG } from '@/data/wizard-configs';
import type { CenterTab, CenterTabType } from '@/data/tabs/interface';
import type { OnboardingWizardProps } from './center-workspace/OnboardingWizard';

export type CenterView = 'home' | 'employees' | 'communications';

type CenterWorkspaceProps = {
  tabs: CenterTab[];
  activeTabId: string | null;
  workspaceMap: Record<string, string>;
  centerView: CenterView | null;
  activeWorkspaceId: string;
  activeEmployeeId?: string | null;
  selectedTicketId?: string | null;
  hasData: boolean;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTicketSelect?: (id: string) => void;
  onEmployeeSelect?: (id: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

function getViewLabel(centerView: CenterView | null, activeTab: CenterTab | null): string {
  if (centerView === 'employees') return 'Employees';
  if (centerView === 'communications') return 'Communications';
  if (!activeTab) return '';
  const labels: Record<CenterTabType, string> = {
    chat: 'Chat',
    projects: 'Projects',
    tickets: 'Tickets',
  };
  return labels[activeTab.type];
}

export function CenterWorkspace({
  tabs,
  activeTabId,
  workspaceMap,
  centerView,
  activeWorkspaceId,
  activeEmployeeId,
  selectedTicketId,
  hasData,
  onTabClick,
  onTabClose,
  onTicketSelect,
  onEmployeeSelect,
  onAction,
}: CenterWorkspaceProps) {
  const showChrome = centerView !== 'home';
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;
  const wsId = activeTab?.workspaceId ?? activeWorkspaceId;
  const workspaceName = workspaceMap[wsId] ?? wsId;
  const viewLabel = getViewLabel(centerView, activeTab);

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      {showChrome && (
        <CenterBreadcrumb segments={[workspaceName, viewLabel]} />
      )}
      {showChrome && (
        <CenterTabStrip
          tabs={tabs}
          activeTabId={activeTabId}
          workspaceMap={workspaceMap}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
        />
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {centerView === 'home' && (
          tabs.length === 0 && hasData ? (
            <OnboardingWizard config={BLANK_CANVAS_WIZARD_CONFIG} onAction={onAction} />
          ) : (
            <OnboardingWizard config={HOME_WIZARD_CONFIG} onAction={onAction} />
          )
        )}
        {centerView === 'employees' && (
          <EmployeesView
            onEmployeeSelect={onEmployeeSelect}
            selectedEmployeeId={activeEmployeeId}
          />
        )}
        {centerView === 'communications' && (
          <CommunicationsView workspaceId={activeWorkspaceId} />
        )}
        {!centerView && activeTab?.type === 'chat' && (
          <ChatView workspaceId={wsId} onAction={onAction} />
        )}
        {!centerView && activeTab?.type === 'projects' && (
          <ProjectsView
            workspaceId={activeTab.workspaceId}
            onTicketSelect={onTicketSelect}
            onAction={onAction}
          />
        )}
        {!centerView && activeTab?.type === 'tickets' && (
          <TicketsView
            workspaceId={activeTab.workspaceId}
            onTicketSelect={onTicketSelect}
          />
        )}
      </div>
    </div>
  );
}
