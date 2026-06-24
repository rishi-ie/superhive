import { useRef, useEffect } from 'react';
import { RightPanelTabs } from './right-auxiliary/RightPanelTabs';
import { TelemetryDeck } from './right-auxiliary/TelemetryDeck';
import { ControlMatrix } from './right-auxiliary/ControlMatrix';
import { AuditQueue } from './right-auxiliary/AuditQueue';
import { RightPanelActivityFeed } from './right-auxiliary/RightPanelActivityFeed';
import { SessionsView } from './right-auxiliary/SessionsView';
import { TicketOverviewTab } from './right-auxiliary/TicketOverviewTab';
import { ProjectOverviewTab } from './right-auxiliary/ProjectDetailsTab';
import { ChannelOverviewTab } from './right-auxiliary/ChannelOverviewTab';
import { TicketManageTab } from './right-auxiliary/TicketManageTab';
import { ProjectManageTab } from './right-auxiliary/ProjectManageTab';
import { ChannelManageTab } from './right-auxiliary/ChannelManageTab';
import { ProjectInboxTab } from './right-auxiliary/ProjectInboxTab';
import { ChannelThreadTab } from './right-auxiliary/ChannelThreadTab';
import { GlobalStatsTab } from './right-auxiliary/GlobalStatsTab';
import { PanelEmptyState } from './right-auxiliary/PanelEmptyState';
import { getRightPanelTabs, type RightPanelContext, type RightPanelTabId } from '@/data/right-panel-tabs';
import {
  getAgent,
  getActiveAgent,
  listAgents,
  nameToAgentId,
  getAuditItems,
  getAgentWorkspace,
  type Agent,
} from '@/data/agents/store';
import {
  getProject,
  getProjectByWorkspace,
  listProjectAgents,
  listSwarmActivity,
  listChannels,
  listChannelMessages,
  getProjectIdByTicketId,
  type ProjectAgent,
  type CommunicationChannel,
  type ChannelMessage,
  type SwarmActivity,
} from '@/data/projects/store';
import { listUniversalTickets, type UniversalTicket } from '@/data/tickets/store';
import { listWorkspaces } from '@/data/workspaces/store';

type RightAuxiliaryProps = {
  width: number;
  onWidthChange: (width: number) => void;
  context: RightPanelContext;
  tab: RightPanelTabId | null;
  onTabChange?: (tab: RightPanelTabId) => void;
  onApproveAudit?: (id: string) => void;
  onDenyAudit?: (id: string) => void;
  onRefresh?: () => void;
  onTerminate?: (agentId: string) => void;
  onViewDiff?: (auditItemId: string) => void;
  onAuditCountClick?: (agentId: string) => void;
  onAgentClick?: (agentId: string) => void;
  onProjectClick?: (projectId: string, workspaceId: string) => void;
  onProjectSelect?: (workspaceId: string) => void;
  onChannelClick?: (channelId: string, workspaceId: string) => void;
  onTicketClick?: (ticketId: string) => void;
  onThreadSelect?: (threadId: string) => void;
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function RightAuxiliary({
  width,
  onWidthChange,
  context,
  tab,
  onTabChange,
  onApproveAudit,
  onDenyAudit,
  onRefresh,
  onTerminate,
  onViewDiff,
  onAuditCountClick,
  onAgentClick,
  onProjectClick,
  onProjectSelect,
  onChannelClick,
  onTicketClick,
  onThreadSelect,
}: RightAuxiliaryProps) {
  const isResizingRef = useRef(false);

  const rightPanelTabs = getRightPanelTabs(context);
  const effectiveTab = rightPanelTabs.some(t => t.id === tab) ? tab : (rightPanelTabs[0]?.id ?? null);
  const showEmptyState = !context || rightPanelTabs.length === 0;

  // ─── Data per context kind ──────────────────────────────────────

  const agentData = context?.kind === 'agent' ? getAgent(context.agentId) : null;
  const activeAgent = context?.kind === 'agent'
    ? agentData ?? getActiveAgent(context.agentId)
    : getActiveAgent(null);

  const projectData = context?.kind === 'project' && context.projectId
    ? getProject(context.projectId)
    : null;
  const projectWorkspaceId = context?.kind === 'project'
    ? context.workspaceId
    : context?.kind === 'agent' && context.agentId
    ? getAgentWorkspace(context.agentId) ?? 'vela'
    : 'vela';

  const channelData = context?.kind === 'channel'
    ? listChannels(context.workspaceId).find(c => c.id === context.channelId)
    : null;

  const universalTickets = listUniversalTickets();
  const ticketData = context?.kind === 'ticket' && context.ticketId
    ? universalTickets.find(t => t.id === context.ticketId) ?? null
    : null;

  const ticketProjectId = ticketData ? getProjectIdByTicketId(ticketData.id) : null;
  const ticketProject = ticketProjectId ? getProject(ticketProjectId) : null;
  const ticketWorkspaceId = ticketData?.workspaceId ?? 'vela';
  const ticketProjectAgents = ticketWorkspaceId ? listProjectAgents(ticketWorkspaceId) : [];

  const ticketRelatedChannel = context?.kind === 'ticket' && ticketData
    ? listChannels(ticketWorkspaceId).find(c => c.relatedTicketId === ticketData.id)
    : null;

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

  const projectInboxAuditItems = projectData ? getAuditItems() : [];

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
  const workspacesData = listWorkspaces();

  const universalProjectsData = context?.kind === 'universal-projects'
    ? workspacesData.map(w => getProjectByWorkspace(w.id)).filter((p): p is NonNullable<typeof p> => p !== undefined)
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
          <PanelEmptyState
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
            <div className="flex-1 overflow-y-auto">

              {/* ── AGENT ── */}
              {effectiveTab === 'overview' && context?.kind === 'agent' && agentData && (
                <>
                  <TelemetryDeck agent={agentData} />
                  {listSwarmActivity(projectWorkspaceId).length > 0 && (
                    <RightPanelActivityFeed
                      items={listSwarmActivity(projectWorkspaceId)}
                      agents={listProjectAgents(projectWorkspaceId)}
                      onAgentClick={onAgentClick}
                    />
                  )}
                </>
              )}
              {effectiveTab === 'manage' && context?.kind === 'agent' && agentData && (
                <ControlMatrix agent={agentData} onTerminate={onTerminate} />
              )}
              {effectiveTab === 'inbox' && context?.kind === 'agent' && (
                <AuditQueue
                  agent={activeAgent}
                  onApprove={onApproveAudit}
                  onDeny={onDenyAudit}
                  onViewDiff={onViewDiff}
                  onAuditCountClick={onAuditCountClick}
                />
              )}
              {effectiveTab === 'sessions' && context?.kind === 'agent' && (
                <SessionsView onThreadSelect={onThreadSelect} />
              )}

              {/* ── TICKET ── */}
              {effectiveTab === 'overview' && context?.kind === 'ticket' && ticketData && (
                <TicketOverviewTab
                  ticket={ticketData}
                  projectAgents={ticketProjectAgents}
                  recentActivity={ticketSwarmActivity}
                  onAgentClick={onAgentClick}
                  onProjectSelect={onProjectSelect}
                  onChannelClick={onChannelClick}
                />
              )}
              {effectiveTab === 'manage' && context?.kind === 'ticket' && ticketData && (
                <TicketManageTab
                  ticket={ticketData}
                  agents={listAgents()}
                />
              )}

              {/* ── PROJECT ── */}
              {effectiveTab === 'overview' && context?.kind === 'project' && projectData && (
                <ProjectOverviewTab
                  project={projectData}
                  onAgentClick={onAgentClick}
                  onChannelClick={onChannelClick}
                />
              )}
              {effectiveTab === 'manage' && context?.kind === 'project' && projectData && (
                <ProjectManageTab
                  project={projectData}
                  availableAgents={listProjectAgents(projectWorkspaceId)}
                />
              )}
              {effectiveTab === 'inbox' && context?.kind === 'project' && projectData && (
                <ProjectInboxTab
                  projectName={projectData.title}
                  auditItems={getAuditItems()}
                  onApprove={onApproveAudit}
                  onDeny={onDenyAudit}
                  onViewDiff={onViewDiff}
                  onAuditCountClick={onAuditCountClick}
                />
              )}

              {/* ── CHANNEL ── */}
              {effectiveTab === 'overview' && context?.kind === 'channel' && channelData && (
                <ChannelOverviewTab
                  channel={channelData}
                  workspaceId={context.workspaceId}
                  relatedTicket={channelRelatedTicket}
                  participants={channelParticipants}
                  recentMessages={channelMessages}
                  onParticipantClick={(name) => {
                    const id = nameToAgentId(name);
                    if (id && onAgentClick) onAgentClick(id);
                  }}
                  onTicketClick={onTicketClick}
                />
              )}
              {effectiveTab === 'manage' && context?.kind === 'channel' && channelData && (
                <ChannelManageTab
                  channel={channelData}
                  availableAgents={listProjectAgents(context.workspaceId)}
                />
              )}
              {effectiveTab === 'thread' && context?.kind === 'channel' && (
                <ChannelThreadTab
                  channelId={context.channelId}
                  messages={channelMessages}
                  agents={listProjectAgents(context.workspaceId)}
                  onParticipantClick={onAgentClick}
                />
              )}

              {/* ── CHANNELS LIST ── */}
              {effectiveTab === 'global-stats' && context?.kind === 'channels-list' && (
                <GlobalStatsTab
                  kind="channels-list"
                  workspaceId={context.workspaceId}
                  channels={listChannelsData}
                  onChannelClick={onChannelClick}
                />
              )}

              {/* ── AGENTS LIST ── */}
              {effectiveTab === 'global-stats' && context?.kind === 'agents-list' && (
                <GlobalStatsTab
                  kind="agents-list"
                  workspaceId={context.workspaceId}
                  agents={listAgentsData}
                  projectAgents={listProjectAgentsData}
                  onAgentClick={onAgentClick}
                />
              )}

              {/* ── UNIVERSAL AGENTS ── */}
              {effectiveTab === 'global-stats' && context?.kind === 'universal-agents' && (
                <GlobalStatsTab
                  kind="universal-agents"
                  agents={universalAgentsData}
                  workspaces={workspacesData}
                  onAgentClick={onAgentClick}
                />
              )}

              {/* ── UNIVERSAL PROJECTS ── */}
              {effectiveTab === 'global-stats' && context?.kind === 'universal-projects' && (
                <GlobalStatsTab
                  kind="universal-projects"
                  projects={universalProjectsData}
                  universalTickets={universalTickets}
                  workspaces={workspacesData}
                  onProjectClick={onProjectClick}
                />
              )}

            </div>
          </>
        )}
      </div>
    </>
  );
}
