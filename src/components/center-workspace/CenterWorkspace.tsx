/**
 * Orchestrates the three-panel workspace layout with tab management.
 * @see TabBody
 */
import { CenterBreadcrumb } from './CenterBreadcrumb';
import { CenterTabStrip } from './CenterTabStrip';
import { OnboardingWizard } from './OnboardingWizard';
import { CENTER_EMPTY_STATE_CONFIG } from '@/data/config/wizard-configs';
import { TabBody } from './TabBody';
import type { CenterTab } from '@/data/tabs/interface';
import type { OnboardingWizardProps } from './OnboardingWizard';

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
  onSend?: (message: string) => void;
  onOpenTickets?: () => void;
};

/**
 * @param tabs - All open tabs
 * @param activeTabId - Currently active tab ID
 * @param workspaceMap - Map of workspace ID to name
 * @param onTabClick - Called when a tab is clicked
 * @param onTabClose - Called when a tab close button is clicked
 * @param onBreadcrumbJump - Called when breadcrumb segment is clicked
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentSelect - Called when an agent is selected
 * @param onProjectSelect - Called when a project is selected
 * @param onChannelSelect - Called when a channel is selected
 * @param onAction - Called when an onboarding action is taken
 * @param onSend - Called when a chat message is sent
 * @param onOpenTickets - Called when "open tickets" is clicked
 */
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
  onSend,
  onOpenTickets,
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
          onSend={onSend}
          onOpenTickets={onOpenTickets}
        />
      </div>
    </div>
  );
}
