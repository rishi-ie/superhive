/**
 * Root right auxiliary panel — 4-tab strip (Overview/Manage/Inbox/Sessions) with context-adapted content.
 */
import { useRef, useEffect } from 'react';
import { RightPanelTabs } from './RightPanelTabs';
import { EmptyState } from './shared/EmptyState';
import { getRightPanelTabs, type RightPanelContext, type RightPanelTabId } from '@/data/config/right-panel-tabs';
import {
  getAgent,
  listAgents,
  nameToAgentId,
} from '@/data/agents/store';
import {
  getProject,
  getProjectByWorkspace,
  listProjectAgents,
  listSwarmActivity,
  listChannels,
  listChannelMessages,
  addChannelMessage,
  type ProjectAgent,
} from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import { listWorkspaces } from '@/data/workspaces/store';

import { TelemetryDeck } from './telemetry/TelemetryDeck';
import { ControlMatrix } from './ControlMatrix';
import { SessionsView } from './sessions/SessionsView';
import { TicketOverviewTab } from './TicketOverviewTab';
import { TicketManageTab } from './TicketManageTab';
import { ChannelOverviewTab } from './ChannelOverviewTab';
import { ChannelManageTab } from './ChannelManageTab';
import { GlobalStatsTab } from './global-stats/GlobalStatsTab';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { DashboardInbox } from './dashboard/DashboardInbox';
import { AgentInbox } from './inbox/AgentInbox';
import { TicketInbox } from './inbox/TicketInbox';
import { ProjectInbox } from './inbox/ProjectInbox';
import { ChannelInbox } from './inbox/ChannelInbox';
import { ProjectOverviewTab } from './project/ProjectOverviewTab';
import { ProjectManageTab } from './ProjectManageTab';

type RightAuxiliaryProps = {
  width: number;
  onWidthChange: (width: number) => void;
  context: RightPanelContext;
  tab: RightPanelTabId | null;
  onTabChange?: (tab: RightPanelTabId) => void;
  onRefresh?: () => void;
  onTerminate?: (agentId: string) => void;
  onAgentClick?: (agentId: string) => void;
  onProjectSelect?: (workspaceId: string) => void;
  onChannelClick?: (channelId: string, workspaceId: string) => void;
  onTicketClick?: (ticketId: string) => void;
  onThreadSelect?: (threadId: string) => void;
  onOpenTab?: (kind: string) => void;
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

/**
 * Root right auxiliary panel — 4-tab strip with context-adapted content.
 * @param width - Panel width in pixels
 * @param onWidthChange - Called when panel is resized
 * @param context - Current context (agent, project, ticket, channel, etc.)
 * @param tab - Active tab id within the panel
 * @param onTabChange - Called when tab changes
 * @param onRefresh - Called when refresh is clicked
 * @param onTerminate - Called when agent termination is requested
 * @param onAgentClick - Called when agent is clicked
 * @param onProjectSelect - Called when project is selected
 * @param onChannelClick - Called when channel is clicked
 * @param onTicketClick - Called when ticket is clicked
 * @param onThreadSelect - Called when thread is selected
 * @param onOpenTab - Called to open a new tab of a given kind
 */
export function RightAuxiliary({
  width,
  onWidthChange,
  context,
  tab,
  onTabChange,
  onRefresh,
  onTerminate,
  onAgentClick,
  onProjectSelect,
  onChannelClick,
  onTicketClick,
  onThreadSelect,
  onOpenTab,
}: RightAuxiliaryProps) {
  const isResizingRef = useRef(false);

  const rightPanelTabs = getRightPanelTabs(context);
  const effectiveTab = rightPanelTabs.some(t => t.id === tab) ? tab : (rightPanelTabs[0]?.id ?? null);
  const showEmptyState = !context || rightPanelTabs.length === 0;

  // ─── Data per context kind ──────────────────────────────────────

  const agentData = context?.kind === 'agent' ? getAgent(context.agentId) : null;

  const projectData = context?.kind === 'project' && context.projectId
    ? getProject(context.projectId)
    : null;

  const channelData = context?.kind === 'channel'
    ? listChannels(context.workspaceId).find(c => c.id === context.channelId)
    : null;

  const universalTickets = listUniversalTickets();
  const workspacesData = listWorkspaces();
  const ticketData = context?.kind === 'ticket' && context.ticketId
    ? universalTickets.find(t => t.id === context.ticketId) ?? null
    : null;

  const ticketWorkspaceId = ticketData?.workspaceId ?? workspacesData[0]?.id ?? 'vela';
  const ticketProjectAgents = ticketWorkspaceId ? listProjectAgents(ticketWorkspaceId) : [];
  const ticketSwarmActivity = ticketWorkspaceId ? listSwarmActivity(ticketWorkspaceId) : [];

  const channelWorkspaceId = context?.kind === 'channel' ? context.workspaceId : null;
  const channelParticipants = channelWorkspaceId && channelData
    ? (() => {
        const allAgents = listProjectAgents(channelWorkspaceId);
        return channelData.participants.map(name => allAgents.find(a => a.name === name)).filter(Boolean) as ProjectAgent[];
      })()
    : [];

  const channelMessages = context?.kind === 'channel'
    ? listChannelMessages(context.channelId)
    : [];

  const channelRelatedTicket = channelData
    ? universalTickets.find(t => t.id === channelData.relatedTicketId) ?? null
    : null;

  const listChannelsData = context?.kind === 'channels-list'
    ? listChannels(context.workspaceId)
    : [];
  const listAgentsData = context?.kind === 'agents-list'
    ? listAgents()
    : [];
  const listProjectAgentsData = context?.kind === 'agents-list'
    ? listProjectAgents(context?.workspaceId)
    : [];

  const universalAgentsData = context?.kind === 'universal-agents'
    ? listAgents()
    : [];

  const universalProjectsData = context?.kind === 'universal-projects'
    ? workspacesData.map(w => getProjectByWorkspace(w.id)).filter((p): p is NonNullable<typeof p> => p !== undefined)
    : [];

  const universalChannelsData = context?.kind === 'universal-channels'
    ? listChannels()
    : [];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // ─── Render content per tab ──────────────────────────────────────

  function renderContent() {
    if (!context || showEmptyState) {
      return (
        <EmptyState
          title="No selection"
          description="Select a project, agent, or ticket to see details here."
        />
      );
    }

    switch (effectiveTab) {
      case 'overview':
        return (
          <>
            {context.kind === 'agent' && agentData && (
              <TelemetryDeck agent={agentData} onTicketClick={onTicketClick} />
            )}
            {context.kind === 'ticket' && ticketData && (
              <TicketOverviewTab
                ticket={ticketData}
                projectAgents={ticketProjectAgents}
                recentActivity={ticketSwarmActivity}
                onAgentClick={onAgentClick}
                onProjectSelect={onProjectSelect}
                onChannelClick={onChannelClick}
              />
            )}
            {context.kind === 'project' && projectData && (
              <ProjectOverviewTab
                project={projectData}
                onTicketClick={onTicketClick}
                onAgentClick={onAgentClick}
                onChannelClick={onChannelClick}
              />
            )}
            {context.kind === 'channel' && channelData && (
              <ChannelOverviewTab
                channel={channelData}
                relatedTicket={channelRelatedTicket}
                participants={channelParticipants}
                messages={channelMessages}
                onParticipantClick={(name) => {
                  const id = nameToAgentId(name);
                  if (id && onAgentClick) onAgentClick(id);
                }}
                onTicketClick={onTicketClick}
                onSend={(content) => {
                  addChannelMessage(channelData.id, 'You', content, false);
                }}
              />
            )}
            {context.kind === 'channels-list' && (
              <GlobalStatsTab
                kind="channels-list"
                workspaceId={context.workspaceId}
                channels={listChannelsData}
                onChannelClick={onChannelClick}
              />
            )}
            {context.kind === 'agents-list' && (
              <GlobalStatsTab
                kind="agents-list"
                workspaceId={context.workspaceId}
                agents={listAgentsData}
                projectAgents={listProjectAgentsData}
                onAgentClick={onAgentClick}
              />
            )}
            {context.kind === 'universal-agents' && (
              <GlobalStatsTab
                kind="universal-agents"
                agents={universalAgentsData}
                workspaces={workspacesData}
                onAgentClick={onAgentClick}
              />
            )}
            {context.kind === 'universal-projects' && (
              <GlobalStatsTab
                kind="universal-projects"
                projects={universalProjectsData}
                universalTickets={universalTickets}
                workspaces={workspacesData}
                onProjectClick={onProjectSelect}
              />
            )}
            {context.kind === 'universal-channels' && (
              <GlobalStatsTab
                kind="universal-channels"
                channels={universalChannelsData}
                onChannelClick={onChannelClick}
              />
            )}
            {context.kind === 'dashboard' && (
              <DashboardOverview
                onTicketClick={onTicketClick}
                onOpenTab={onOpenTab}
              />
            )}
          </>
        );

      case 'manage':
        return (
          <>
            {context.kind === 'agent' && agentData && (
              <ControlMatrix agent={agentData} onTerminate={onTerminate} />
            )}
            {context.kind === 'ticket' && ticketData && (
              <TicketManageTab
                ticket={ticketData}
                agents={listAgents()}
              />
            )}
            {context.kind === 'project' && projectData && (
              <ProjectManageTab project={projectData} />
            )}
            {context.kind === 'channel' && channelData && (
              <ChannelManageTab
                channel={channelData}
                availableAgents={listProjectAgents(context.workspaceId)}
              />
            )}
          </>
        );

      case 'inbox':
        return (
          <>
            {context.kind === 'agent' && (
              <AgentInbox
                onTicketClick={onTicketClick}
              />
            )}
            {context.kind === 'ticket' && ticketData && (
              <TicketInbox ticketId={ticketData.id} />
            )}
            {context.kind === 'project' && projectData && (
              <ProjectInbox
                project={projectData}
                onTicketClick={onTicketClick}
              />
            )}
            {context.kind === 'channel' && channelData && (
              <ChannelInbox channelId={channelData.id} />
            )}
            {context.kind === 'dashboard' && (
              <DashboardInbox
                onTicketClick={onTicketClick}
              />
            )}
          </>
        );

      case 'sessions':
        if (context.kind === 'agent') {
          return <SessionsView onThreadSelect={onThreadSelect} />;
        }
        return (
          <EmptyState
            title="No sessions"
            description="Sessions are available for agents only"
          />
        );

      default:
        return null;
    }
  }

  return (
    <>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
      <div
        className="flex h-full flex-col bg-sidebar border-l border-border/50"
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <div className="h-9 shrink-0" />
        {showEmptyState ? (
          <EmptyState
            title="No selection"
            description="Select a project, agent, or ticket to see details here."
          />
        ) : (
          <>
            <RightPanelTabs
              tabs={rightPanelTabs}
              activeTab={effectiveTab ?? undefined}
              onTabChange={(id) => onTabChange?.(id as RightPanelTabId)}
              onRefresh={onRefresh}
            />
            <div className="flex-1 min-h-0 overflow-y-auto">
              {renderContent()}
            </div>
          </>
        )}
      </div>
    </>
  );
}
