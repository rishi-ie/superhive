/**
 * Three-panel workspace shell — LeftNav + CenterWorkspace + RightAuxiliary.
 * Orchestrates tab state, workspace selection, and cross-panel event routing.
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { LeftNav } from '@/components/left-nav/LeftNav';
import { CenterWorkspace } from '@/components/center-workspace/CenterWorkspace';
import { RightAuxiliary } from '@/components/right-auxiliary/RightAuxiliary';
import { CreateProjectDialog } from '@/components/center-workspace/CreateProjectDialog';
import { DEFAULT_LEFT_WIDTH, DEFAULT_RIGHT_WIDTH } from '@/lib/constants';
import type { Page } from '@/App';
import type { ActiveAgent } from '@/components/left-nav/ActiveSection';
import type { ArchivedProjectSummary } from '@/components/left-nav/ArchivedProjectsSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents, getProject, getProjectByWorkspace, listProjects } from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import { listFavorites } from '@/data/favorites/store';
import { listAgents, getAgentWorkspace } from '@/data/agents/store';
import { addMessageToActiveThread } from '@/data/chat/store';
import {
  makeInitialTabState,
  openOrFocusTab as openTabOp,
  closeTab as closeTabOp,
  selectTab as selectTabOp,
  getActiveTab,
  findTab,
  setSelection,
} from '@/data/tabs/store';
import type { CenterTabType, CenterTab } from '@/data/tabs/interface';
import type { Workspace } from '@/data/workspaces/interface';
import type { FavoriteItem } from '@/data/favorites/interface';
import {
  getRightPanelTabs,
  getDefaultRightPanelTab,
  type RightPanelContext,
  type RightPanelTabId,
} from '@/data/config/right-panel-tabs';

type DashboardProps = {
  leftWidth: number;
  rightWidth: number;
  onLeftWidthChange: (width: number) => void;
  onRightWidthChange: (width: number) => void;
  onNavigate: (page: Page) => void;
};

function toActiveAgent(agents: ReturnType<typeof listAgents>): ActiveAgent[] {
  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status === 'EXECUTING' || a.status === 'COMPILING' || a.status === 'AWAITING_HUMAN'
      ? 'active'
      : a.status === 'IDLE'
      ? 'idle'
      : 'busy',
    currentTask: a.activeTask,
  }));
}

function buildTab(
  type: CenterTabType,
  workspaceId: string,
  title: string,
  extra: Partial<Pick<CenterTab, 'selectedAgentId' | 'selectedProjectId' | 'selectedTicketId' | 'selectedChannelId' | 'subtitle'>> = {},
) {
  return { type, workspaceId, title, subtitle: extra.subtitle, pinned: false, modified: false,
    selectedAgentId: extra.selectedAgentId ?? null,
    selectedProjectId: extra.selectedProjectId ?? null,
    selectedTicketId: extra.selectedTicketId ?? null,
    selectedChannelId: extra.selectedChannelId ?? null,
  };
}

/**
 * Three-panel workspace shell — LeftNav + CenterWorkspace + RightAuxiliary.
 * @param leftWidth - Current width of the left navigation panel
 * @param rightWidth - Current width of the right auxiliary panel
 * @param onLeftWidthChange - Callback when left panel width changes
 * @param onRightWidthChange - Callback when right panel width changes
 * @param onNavigate - Callback when user navigates to a different page (e.g. settings)
 */
export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [tabState, setTabState] = useState(() => {
    const firstWs = listWorkspaces()[0];
    return makeInitialTabState(firstWs?.id ?? 'acme');
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => listWorkspaces()[0]?.id ?? 'acme');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTabId>('overview');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectsVersion, setProjectsVersion] = useState(0);

  const workspaces_data = listWorkspaces();
  const currentWorkspace = workspaces_data.find(w => w.id === activeWorkspaceId) ?? workspaces_data[0] ?? { id: '1', name: 'My Workspace', initials: 'MW', avatarColor: 'bg-chart-1' };
  const favorites_data = listFavorites();
  const workspaceAgents = listProjectAgents(activeWorkspaceId);
  const workspaceAgentNames = new Set(workspaceAgents.map(a => a.name));
  const agents_data = toActiveAgent(
    listAgents().filter(a => workspaceAgentNames.has(a.name))
  );

  const workspaceMap = useMemo(
    () => Object.fromEntries(listWorkspaces().map(w => [w.id, w.name])),
    [],
  );

  const archivedProjects = useMemo<ArchivedProjectSummary[]>(
    () =>
      listProjects({ status: 'ARCHIVED' }).map(p => ({
        id: p.id,
        workspaceId: p.workspaceId,
        title: p.title,
        color: p.color,
      })),
    [projectsVersion],
  );

  const bumpProjectsVersion = useCallback(() => {
    setProjectsVersion(v => v + 1);
  }, []);

  const activeTab = getActiveTab(tabState);

  const rightPanelContext = useMemo<RightPanelContext>(() => {
    if (!activeTab) return null;
    if (activeTab.type === 'agent' && activeTab.selectedAgentId) return { kind: 'agent', agentId: activeTab.selectedAgentId };
    if (activeTab.type === 'tickets' && activeTab.selectedTicketId) return { kind: 'ticket', ticketId: activeTab.selectedTicketId };
    if (activeTab.type === 'project' && activeTab.selectedProjectId) return { kind: 'project', projectId: activeTab.selectedProjectId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channel' && activeTab.selectedChannelId) return { kind: 'channel', channelId: activeTab.selectedChannelId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channels') return { kind: 'channels-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'agents') return { kind: 'agents-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'universal-agents') return { kind: 'universal-agents' };
    if (activeTab.type === 'universal-projects') return { kind: 'universal-projects' };
    if (activeTab.type === 'universal-channels') return { kind: 'universal-channels' };
    if (activeTab.type === 'home') return { kind: 'home', workspaceId: activeTab.workspaceId };
    return null;
  }, [activeTab]);

  const rightPanelTabs = getRightPanelTabs(rightPanelContext);
  const defaultRightTab = getDefaultRightPanelTab(rightPanelContext);
  const currentRightPanelTab = rightPanelTabs.some(t => t.id === rightPanelTab) ? rightPanelTab : defaultRightTab;

  // ─── Tab operations ────────────────────────────────────────────────

  const openTab = useCallback((tab: Omit<CenterTab, 'id' | 'createdAt'>) => {
    setTabState(prev => openTabOp(prev, tab));
  }, []);

  // ─── Click handlers ───────────────────────────────────────────────

  const handleNavItemClick = useCallback((id: string) => {
    const ws = activeWorkspaceId;
    if (id === 'agents' || id === 'universal-agents') {
      openTab(buildTab('universal-agents', ws, 'Agents'));
    } else if (id === 'communications') {
      openTab(buildTab('channels', ws, 'Comms'));
    } else if (id === 'projects' || id === 'universal-projects') {
      openTab(buildTab('universal-projects', ws, 'Projects'));
    } else if (id === 'tickets') {
      openTab(buildTab('tickets', ws, 'Tickets'));
    }
  }, [openTab, activeWorkspaceId]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
  }, []);

  const handleAgentSelect = useCallback((id: string) => {
    const ws = getAgentWorkspace(id) ?? activeWorkspaceId;
    const agent = listAgents().find(a => a.id === id);
    openTab(buildTab('agent', ws, agent?.name ?? 'Agent', { selectedAgentId: id }));
  }, [openTab, activeWorkspaceId]);

  const handleProjectSelect = useCallback((projectId: string, workspaceId: string) => {
    const project = getProject(projectId);
    openTab(buildTab('project', workspaceId, project?.title ?? 'Project', { selectedProjectId: projectId }));
  }, [openTab]);

  const handleTicketSelect = useCallback((ticketId: string) => {
    const ticket = listUniversalTickets().find(t => t.id === ticketId);
    const ws = ticket?.workspaceId ?? activeWorkspaceId;

    setTabState(prev => {
      const existing = findTab(prev, 'tickets', ws, null);
      if (existing) {
        const updated = setSelection(prev, existing.id, { selectedTicketId: ticketId });
        return selectTabOp(updated, existing.id);
      }
      return openTabOp(prev, buildTab('tickets', ws, 'Tickets', { selectedTicketId: ticketId }));
    });
    setRightPanelTab('overview');
  }, [activeWorkspaceId]);

  const handleChannelSelect = useCallback((channelId: string, workspaceId: string) => {
    openTab(buildTab('channel', workspaceId, 'Channel', { selectedChannelId: channelId }));
  }, [openTab]);

  const handleFavoriteSelect = useCallback((item: FavoriteItem) => {
    if (item.type === 'agent') {
      handleAgentSelect(item.id);
    } else if (item.type === 'project') {
      const project = getProject(item.id);
      if (project) {
        handleProjectSelect(project.id, project.workspaceId);
      }
    }
  }, [handleAgentSelect, handleProjectSelect]);

  const handleTabClick = useCallback((tabId: string) => {
    setTabState(prev => selectTabOp(prev, tabId));
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabState(prev => {
      const next = closeTabOp(prev, tabId);
      return next;
    });
  }, []);

  const handleBreadcrumbJump = useCallback((workspaceId: string, section?: string) => {
    if (section) {
      const SECTION_TAB: Record<string, CenterTabType> = {
        Projects: 'projects',
        Tickets: 'tickets',
        Comms: 'channels',
        Agents: 'agents',
      };
      const type = SECTION_TAB[section];
      if (type) openTab(buildTab(type, workspaceId, section));
    } else {
      openTab(buildTab('projects', workspaceId, 'Projects', {},));
    }
  }, [openTab]);

  const handleCreateProject = useCallback(() => {
    setCreateProjectOpen(true);
  }, []);

  const handleCreateTicket = useCallback(() => {
    openTab(buildTab('tickets', activeWorkspaceId, 'Tickets'));
  }, [openTab, activeWorkspaceId]);

  const handleCreateChannel = useCallback(() => {
    openTab(buildTab('channels', activeWorkspaceId, 'Comms'));
  }, [openTab, activeWorkspaceId]);

  const handleCreateAgent = useCallback(() => {
    openTab(buildTab('agents', activeWorkspaceId, 'Agents'));
  }, [openTab, activeWorkspaceId]);

  const handleProjectCreated = useCallback((project: import('@/data/projects/interface').Project) => {
    bumpProjectsVersion();
    openTab(buildTab('project', project.workspaceId, project.title, { selectedProjectId: project.id }));
  }, [openTab, bumpProjectsVersion]);

  const handleTerminateAgent = useCallback((agentId: string) => {
    console.warn('[TODO] Terminate agent:', agentId);
  }, []);

  const handleRefresh = useCallback(() => {
    console.warn('[TODO] Refresh right panel');
  }, []);

  const handleProjectSelectByWorkspace = useCallback((workspaceId: string) => {
    const project = getProjectByWorkspace(workspaceId);
    if (project) openTab(buildTab('project', workspaceId, project.title, { selectedProjectId: project.id }));
  }, [openTab]);

  const handleOpenTab = useCallback((kind: string) => {
    if (kind === 'tickets') {
      openTab(buildTab('tickets', activeWorkspaceId, 'Tickets'));
    } else if (kind === 'universal-channels') {
      openTab(buildTab('universal-channels', activeWorkspaceId, 'Channels'));
    } else if (kind === 'universal-agents') {
      openTab(buildTab('universal-agents', activeWorkspaceId, 'Agents'));
    }
  }, [openTab, activeWorkspaceId]);

  const handleChannelClick = handleChannelSelect;

  const handleThreadSelect = useCallback((threadId: string) => {
    console.warn('[TODO] Reopen thread:', threadId);
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    addMessageToActiveThread(message);
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    onLeftWidthChange(leftWidth === 0 ? DEFAULT_LEFT_WIDTH : 0);
  }, [leftWidth, onLeftWidthChange]);

  const handleToggleRightPanel = useCallback(() => {
    onRightWidthChange(rightWidth === 0 ? DEFAULT_RIGHT_WIDTH : 0);
  }, [rightWidth, onRightWidthChange]);

  const handleOpenTickets = useCallback(() => {
    openTab(buildTab('tickets', activeWorkspaceId, 'Tickets'));
  }, [openTab, activeWorkspaceId]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'w') {
        e.preventDefault();
        if (activeTab && !activeTab.pinned) {
          handleTabClose(activeTab.id);
        }
      }
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const tab = tabState.tabs[idx];
        if (tab) handleTabClick(tab.id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabState.tabs, handleTabClose, handleTabClick]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        workspaces={workspaces_data}
        currentWorkspace={currentWorkspace}
        favorites={favorites_data}
        activeAgents={agents_data}
        archivedProjects={archivedProjects}
        onWorkspaceSelect={handleWorkspaceSelect}
        onSettingsClick={() => onNavigate('settings')}
        onFavoritesItemClick={handleFavoriteSelect}
        onActiveAgentClick={handleAgentSelect}
        onNavItemClick={handleNavItemClick}
        currentView={activeTab?.type ?? 'projects'}
        onAgentSelect={handleAgentSelect}
        onProjectClick={handleProjectSelect}
        onToggleLeftPanel={handleToggleLeftPanel}
        onToggleRightPanel={handleToggleRightPanel}
      />
      <CenterWorkspace
        tabs={tabState.tabs}
        activeTabId={tabState.activeTabId}
        workspaceMap={workspaceMap}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onBreadcrumbJump={handleBreadcrumbJump}
        onTicketSelect={handleTicketSelect}
        onAgentSelect={handleAgentSelect}
        onProjectSelect={handleProjectSelect}
        onChannelSelect={handleChannelSelect}
        onNavItemClick={handleNavItemClick}
        onSend={handleSendMessage}
        onOpenTickets={handleOpenTickets}
        onCreateProject={handleCreateProject}
        onCreateTicket={handleCreateTicket}
        onCreateChannel={handleCreateChannel}
        onCreateAgent={handleCreateAgent}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        context={rightPanelContext}
        tab={currentRightPanelTab}
        onTabChange={setRightPanelTab}
        onRefresh={handleRefresh}
        onTerminate={handleTerminateAgent}
        onAgentClick={handleAgentSelect}
        onProjectSelect={handleProjectSelectByWorkspace}
        onChannelClick={handleChannelClick}
        onTicketClick={handleTicketSelect}
        onThreadSelect={handleThreadSelect}
        onOpenTab={handleOpenTab}
        onProjectsChanged={bumpProjectsVersion}
      />
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreated={handleProjectCreated}
        defaultWorkspaceId={activeWorkspaceId}
      />
    </div>
  );
}
