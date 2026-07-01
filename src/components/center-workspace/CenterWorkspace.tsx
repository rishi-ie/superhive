/**
 * Orchestrates the three-panel workspace layout with tab management.
 * @see TabBody
 */
import { CenterBreadcrumb } from './CenterBreadcrumb';
import { CenterTabStrip } from './CenterTabStrip';
import { TabBody } from './TabBody';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { CenterTab } from '@/data/tabs/interface';

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
  onNavItemClick?: (id: string) => void;
  onSend?: (message: string) => void;
  onOpenTickets?: () => void;
  onCreateProject?: () => void;
  onCreateTicket?: () => void;
  onCreateChannel?: () => void;
  onCreateAgent?: () => void;
  setupDismissed: boolean;
  readyDismissed: boolean;
  onWorkspaceCreated: (id: string) => void;
  onDismissSetup: () => void;
  onDismissReady: () => void;
  onOpenSettings: () => void;
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
 * @param onNavItemClick - Called when a nav item is clicked (e.g. section see-more)
 * @param onSend - Called when a chat message is sent
 * @param onOpenTickets - Called when "open tickets" is clicked
 * @param onCreateProject - Called when "New Project" is clicked
 * @param onCreateTicket - Called when "New Ticket" is clicked
 * @param onCreateChannel - Called when "New Channel" is clicked
 * @param onCreateAgent - Called when "New Agent" is clicked
 * @param setupDismissed - Whether the no-workspace setup wizard has been dismissed this session
 * @param readyDismissed - Whether the per-workspace ready wizard has been dismissed for the active workspace
 * @param onWorkspaceCreated - Called after a new workspace is created via the setup wizard
 * @param onDismissSetup - Called when the user dismisses the setup wizard
 * @param onDismissReady - Called when the user dismisses the ready wizard
 * @param onOpenSettings - Called when the user wants to open settings
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
  onNavItemClick,
  onSend,
  onOpenTickets,
  onCreateProject,
  onCreateTicket,
  onCreateChannel,
  onCreateAgent,
  setupDismissed,
  readyDismissed,
  onWorkspaceCreated,
  onDismissSetup,
  onDismissReady,
  onOpenSettings,
}: CenterWorkspaceProps) {
  const activeTab = tabs.find(t => t.id === activeTabId)!;

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

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ErrorBoundary>
          <TabBody
            tab={activeTab}
            onTicketSelect={onTicketSelect}
            onAgentSelect={onAgentSelect}
            onProjectSelect={onProjectSelect}
            onChannelSelect={onChannelSelect}
            onNavItemClick={onNavItemClick}
            onSend={onSend}
            onOpenTickets={onOpenTickets}
            onCreateProject={onCreateProject}
            onCreateTicket={onCreateTicket}
            onCreateChannel={onCreateChannel}
            onCreateAgent={onCreateAgent}
            setupDismissed={setupDismissed}
            readyDismissed={readyDismissed}
            onWorkspaceCreated={onWorkspaceCreated}
            onDismissSetup={onDismissSetup}
            onDismissReady={onDismissReady}
            onOpenSettings={onOpenSettings}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
