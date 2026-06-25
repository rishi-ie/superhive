import { useState, useMemo, useCallback, useEffect } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveAgent } from '@/components/left-nav/ActiveSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents, listTickets, getProject, getProjectByWorkspace } from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import { listFavorites } from '@/data/favorites/store';
import { listAgents, approveAudit, denyAudit, getAgentWorkspace, nameToAgentId } from '@/data/agents/store';
import { addMessageToActiveThread } from '@/data/chat/store';
import {
  makeInitialTabState,
  openOrFocusTab as openTabOp,
  closeTab as closeTabOp,
  selectTab as selectTabOp,
  getActiveTab,
} from '@/data/tabs/store';
import type { CenterTabType, CenterTab } from '@/data/tabs/interface';
import type { Workspace } from '@/data/workspaces/interface';
import type { FavoriteItem } from '@/data/favorites/interface';
import {
  getRightPanelTabs,
  getDefaultRightPanelTab,
  type RightPanelContext,
  type RightPanelTabId,
} from '@/data/right-panel-tabs';

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

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [tabState, setTabState] = useState(() => makeInitialTabState('vela'));
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('vela');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTabId>('overview');

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

  const hasData = workspaces_data.length > 0 || listAgents().length > 0;
  const activeTasks = listTickets(activeWorkspaceId)
    .filter(t => t.status === 'EXECUTING')
    .map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedAgentId }));

  const activeTab = getActiveTab(tabState);

  const rightPanelContext = useMemo<RightPanelContext>(() => {
    if (!activeTab) return null;
    if (activeTab.type === 'agent' && activeTab.selectedAgentId) return { kind: 'agent', agentId: activeTab.selectedAgentId };
    if (activeTab.type === 'ticket' && activeTab.selectedTicketId) return { kind: 'ticket', ticketId: activeTab.selectedTicketId };
    if (activeTab.type === 'project' && activeTab.selectedProjectId) return { kind: 'project', projectId: activeTab.selectedProjectId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channel' && activeTab.selectedChannelId) return { kind: 'channel', channelId: activeTab.selectedChannelId, workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'channels') return { kind: 'channels-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'agents') return { kind: 'agents-list', workspaceId: activeTab.workspaceId };
    if (activeTab.type === 'universal-agents') return { kind: 'universal-agents' };
    if (activeTab.type === 'universal-projects') return { kind: 'universal-projects' };
    if (activeTab.type === 'universal-channels') return { kind: 'universal-channels' };
    return null;
  }, [activeTab]);

  const rightPanelTabs = getRightPanelTabs(rightPanelContext);
  const defaultRightTab = getDefaultRightPanelTab(rightPanelContext);
  const currentRightPanelTab = rightPanelTabs.some(t => t.id === rightPanelTab) ? rightPanelTab : defaultRightTab;

  // ─── Tab operations ────────────────────────────────────────────────

  const openTab = useCallback((tab: Omit<CenterTab, 'id' | 'createdAt'>) => {
    setTabState(prev => openTabOp(prev, tab));
  }, []);

  const openOrReuseTab = useCallback((type: CenterTabType, workspaceId: string, extra: Parameters<typeof buildTab>[3] = {}) => {
    openTab(buildTab(type, workspaceId, '', extra));
  }, [openTab]);

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
    const title = ticket?.title ?? `Ticket ${ticketId}`;
    openTab(buildTab('ticket', ws, title, { selectedTicketId: ticketId, subtitle: ticket?.id }));
    setRightPanelTab('overview');
  }, [activeWorkspaceId, openTab]);

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

  const handleNewTab = useCallback((type: CenterTabType, workspaceId: string) => {
    const TYPE_TITLES: Partial<Record<CenterTabType, string>> = {
      agent: 'Chat',
      projects: 'Projects',
      tickets: 'Tickets',
      ticket: 'Ticket',
      project: 'Project',
      channels: 'Comms',
      channel: 'Channel',
      agents: 'Agents',
      'universal-agents': 'Agents',
      'universal-projects': 'Projects',
      'universal-channels': 'Channels',
    };
    openTab(buildTab(type, workspaceId, TYPE_TITLES[type] ?? ''));
  }, [openTab]);

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

  const handleWizardAction = useCallback((actionId: string) => {
    const ws = activeWorkspaceId;
    if (actionId === 'open-project') {
      openTab(buildTab('projects', ws, 'Projects'));
    } else if (actionId === 'view-agents' || actionId === 'open-agents') {
      openTab(buildTab('agents', ws, 'Agents'));
    } else if (actionId === 'browse-agents' || actionId === 'open-agents') {
      openTab(buildTab('universal-agents', ws, 'Agents'));
    } else if (actionId === 'browse-projects' || actionId === 'open-projects') {
      openTab(buildTab('universal-projects', ws, 'Projects'));
    } else if (actionId === 'open-tickets') {
      openTab(buildTab('tickets', ws, 'Tickets'));
    } else if (actionId === 'open-comms') {
      openTab(buildTab('channels', ws, 'Comms'));
    } else if (actionId === 'browse-channels') {
      openTab(buildTab('universal-channels', ws, 'Channels'));
    }
  }, [openTab, activeWorkspaceId]);

  const handleAuditCountClick = useCallback((agentId: string) => {
    handleAgentSelect(agentId);
    setRightPanelTab('inbox');
  }, [handleAgentSelect]);

  const handleTerminateAgent = useCallback((agentId: string) => {
    console.warn('[TODO] Terminate agent:', agentId);
  }, []);

  const handleViewDiff = useCallback((auditItemId: string) => {
    console.warn('[TODO] View diff for audit item:', auditItemId);
  }, []);

  const handleRefresh = useCallback(() => {
    console.warn('[TODO] Refresh right panel');
  }, []);

  const handleNewTicket = useCallback(() => {
    console.warn('[TODO] Create new ticket');
  }, []);

  const handleNewChannel = useCallback(() => {
    console.warn('[TODO] Create new channel');
  }, []);

  const handleNewAgent = useCallback(() => {
    console.warn('[TODO] Create new agent');
  }, []);

  const handleNewProject = useCallback(() => {
    console.warn('[TODO] Create new project');
  }, []);

  const handleAgentSelectByName = useCallback((name: string) => {
    const id = nameToAgentId(name);
    if (id) handleAgentSelect(id);
  }, [handleAgentSelect]);

  const handleProjectClick = useCallback((projectId: string, workspaceId: string) => {
    const project = getProject(projectId);
    if (project) openTab(buildTab('project', workspaceId, project.title, { selectedProjectId: projectId }));
  }, [openTab]);

  const handleProjectSelectByWorkspace = useCallback((workspaceId: string) => {
    const project = getProjectByWorkspace(workspaceId);
    if (project) openTab(buildTab('project', workspaceId, project.title, { selectedProjectId: project.id }));
  }, [openTab]);

  const handleChannelClick = useCallback((channelId: string, workspaceId: string) => {
    openTab(buildTab('channel', workspaceId, 'Channel', { selectedChannelId: channelId }));
  }, [openTab]);

  const handleThreadSelect = useCallback((threadId: string) => {
    console.warn('[TODO] Reopen thread:', threadId);
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    addMessageToActiveThread(message);
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    onLeftWidthChange(leftWidth === 0 ? 280 : 0);
  }, [leftWidth, onLeftWidthChange]);

  const handleToggleRightPanel = useCallback(() => {
    onRightWidthChange(rightWidth === 0 ? 340 : 0);
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
        activeTasks={activeTasks}
        onWorkspaceSelect={handleWorkspaceSelect}
        onSettingsClick={() => onNavigate('settings')}
        onFavoritesItemClick={handleFavoriteSelect}
        onActiveAgentClick={handleAgentSelect}
        onActiveTaskClick={(id) => handleTicketSelect(id)}
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
        onAction={handleWizardAction}
        onSend={handleSendMessage}
        onOpenTickets={handleOpenTickets}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        context={rightPanelContext}
        tab={currentRightPanelTab}
        onTabChange={setRightPanelTab}
        onApproveAudit={approveAudit}
        onDenyAudit={denyAudit}
        onRefresh={handleRefresh}
        onTerminate={handleTerminateAgent}
        onViewDiff={handleViewDiff}
        onAuditCountClick={handleAuditCountClick}
        onAgentClick={handleAgentSelect}
        onProjectClick={handleProjectClick}
        onProjectSelect={handleProjectSelectByWorkspace}
        onChannelClick={handleChannelClick}
        onTicketClick={handleTicketSelect}
        onThreadSelect={handleThreadSelect}
      />
    </div>
  );
}
