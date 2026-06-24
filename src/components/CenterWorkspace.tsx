import { CenterBreadcrumb } from './center-workspace/CenterBreadcrumb';
import { CenterTabStrip } from './center-workspace/CenterTabStrip';
import { ChatView } from './center-workspace/ChatView';
import { ProjectsView } from './center-workspace/ProjectsView';
import { TicketsView } from './center-workspace/TicketsView';
import { AgentsView } from './center-workspace/AgentsView';
import { CommunicationsView } from './center-workspace/CommunicationsView';
import { OnboardingWizard } from './center-workspace/OnboardingWizard';
import { UniversalProjectsView } from './center-workspace/UniversalProjectsView';
import { UniversalAgentsView } from './center-workspace/UniversalAgentsView';
import { CENTER_EMPTY_STATE_CONFIG } from '@/data/wizard-configs';
import type { CenterTab, CenterTabType } from '@/data/tabs/interface';
import type { OnboardingWizardProps } from './center-workspace/OnboardingWizard';

type CenterWorkspaceProps = {
  tabs: CenterTab[];
  activeTabId: string | null;
  workspaceMap: Record<string, string>;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onBreadcrumbJump?: (workspaceId: string, section?: string) => void;
  onTicketSelect?: (id: string) => void;
  onAgentSelect?: (id: string) => void;
  onProjectSelect?: (id: string, workspaceId: string) => void;
  onChannelSelect?: (id: string, workspaceId: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

export function CenterWorkspace({
  tabs,
  activeTabId,
  workspaceMap,
  onTabClick,
  onTabClose,
  onBreadcrumbJump,
  onTicketSelect,
  onAgentSelect,
  onProjectSelect,
  onChannelSelect,
  onAction,
}: CenterWorkspaceProps) {
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  if (!activeTab) {
    return (
      <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
        <div className="h-2 shrink-0" />
        <div className="flex-1 flex items-center justify-center">
          <OnboardingWizard
            config={CENTER_EMPTY_STATE_CONFIG}
            onAction={onAction}
          />
        </div>
      </div>
    );
  }

  const wsId = activeTab.workspaceId;
  const workspaceName = workspaceMap[wsId] ?? wsId;

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <CenterBreadcrumb
        tab={activeTab}
        workspaceName={workspaceName}
        onJump={onBreadcrumbJump}
      />
      <CenterTabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        workspaceMap={workspaceMap}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <TabBody
          tab={activeTab}
          onTicketSelect={onTicketSelect}
          onAgentSelect={onAgentSelect}
          onProjectSelect={onProjectSelect}
          onChannelSelect={onChannelSelect}
          onAction={onAction}
        />
      </div>
    </div>
  );
}

type TabBodyProps = {
  tab: CenterTab;
  onTicketSelect?: (id: string) => void;
  onAgentSelect?: (id: string) => void;
  onProjectSelect?: (id: string, workspaceId: string) => void;
  onChannelSelect?: (id: string, workspaceId: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

function TabBody({ tab, onTicketSelect, onAgentSelect, onProjectSelect, onChannelSelect, onAction }: TabBodyProps) {
  switch (tab.type) {
    case 'projects':
      return (
        <ProjectsView
          workspaceId={tab.workspaceId}
          onTicketSelect={onTicketSelect}
          onAction={onAction}
        />
      );

    case 'project':
      return (
        <ProjectsView
          workspaceId={tab.workspaceId}
          projectId={tab.selectedProjectId ?? undefined}
          onTicketSelect={onTicketSelect}
          onAction={onAction}
        />
      );

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
        <CommunicationsView
          workspaceId={tab.workspaceId}
          selectedChannelId={tab.selectedChannelId ?? undefined}
          onChannelSelect={onChannelSelect ? (id) => onChannelSelect(id, tab.workspaceId) : undefined}
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
        />
      );

    case 'universal-agents':
      return (
        <UniversalAgentsView
          onAgentSelect={onAgentSelect}
          selectedAgentId={tab.selectedAgentId ?? undefined}
        />
      );

    case 'universal-projects':
      return (
        <UniversalProjectsView
          onProjectSelect={onProjectSelect}
          selectedProjectId={tab.selectedProjectId ?? undefined}
        />
      );

    default:
      return null;
  }
}
