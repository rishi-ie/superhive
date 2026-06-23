import { useState, useMemo, useCallback } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace, type CenterView } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveAgent } from '@/components/left-nav/ActiveSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents, listTickets, getProject } from '@/data/projects/store';
import { listFavorites } from '@/data/favorites/store';
import { listAgents, approveAudit, denyAudit } from '@/data/agents/store';
import {
  makeInitialTabState,
  openTab as openTabOp,
  closeTab as closeTabOp,
  selectTab as selectTabOp,
  setTicketOnTab,
  getActiveTab,
  openProjectTab,
} from '@/data/tabs/store';
import type { CenterTabType } from '@/data/tabs/interface';
import type { Workspace } from '@/data/workspaces/interface';
import type { FavoriteItem } from '@/data/favorites/interface';
import { getRightPanelTabs, getDefaultRightPanelTab, type RightPanelContext, type RightPanelTabId } from '@/data/right-panel-tabs';

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

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [tabState, setTabState] = useState(() => makeInitialTabState('superhive'));
  const [centerView, setCenterView] = useState<CenterView | null>('home');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('vela');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
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
    if (activeTab.type === 'chat' && activeAgentId) return { kind: 'agent', agentId: activeAgentId };
    if (activeTab.type === 'tickets' && activeTab.selectedTicketId) return { kind: 'ticket', ticketId: activeTab.selectedTicketId };
    if (activeTab.type === 'project' && activeTab.selectedProjectId) return { kind: 'project', projectId: activeTab.selectedProjectId };
    if (activeTab.type === 'channel' && activeTab.selectedChannelId) return { kind: 'channel', channelId: activeTab.selectedChannelId };
    if (activeTab.type === 'chat') return { kind: 'agent', agentId: activeAgentId ?? '' };
    return null;
  }, [activeTab, activeAgentId]);

  const rightPanelTabs = getRightPanelTabs(rightPanelContext);
  const defaultRightTab = getDefaultRightPanelTab(rightPanelContext);
  const currentRightPanelTab = rightPanelTabs.some(t => t.id === rightPanelTab) ? rightPanelTab : defaultRightTab;

  const handleOpenTab = useCallback((type: CenterTabType, workspaceId: string) => {
    setTabState(prev => openTabOp(prev, type, workspaceId));
    setCenterView(null);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabState(prev => {
      const next = closeTabOp(prev, tabId);
      if (next.tabs.length === 0) {
        setCenterView('home');
        return next;
      }
      if (next.activeTabId !== prev.activeTabId) {
        setCenterView(null);
      }
      return next;
    });
  }, []);

  const handleSelectTab = useCallback((tabId: string) => {
    setTabState(prev => selectTabOp(prev, tabId));
    setCenterView(null);
  }, []);

  const handleTicketSelect = useCallback((ticketId: string) => {
    if (tabState.activeTabId) {
      setTabState(prev => setTicketOnTab(prev, tabState.activeTabId!, ticketId));
    }
    setRightPanelTab('overview');
  }, [tabState.activeTabId]);

  const handleNavItemClick = useCallback((id: string) => {
    if (id === 'home') { setCenterView('home'); return; }
    if (id === 'agents' || id === 'universal-agents') { setCenterView('universal-agents'); return; }
    if (id === 'communications') { setCenterView('communications'); return; }
    if (id === 'projects' || id === 'universal-projects') { setCenterView('universal-projects'); return; }
    if (id === 'tickets') { setCenterView('tickets'); return; }
    if (id === 'chat') { handleOpenTab('chat', activeWorkspaceId); }
  }, [handleOpenTab, activeWorkspaceId]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    handleOpenTab('projects', workspace.id);
  }, [handleOpenTab]);

  const handleAgentSelect = useCallback((id: string) => {
    setActiveAgentId(id);
    handleOpenTab('chat', activeWorkspaceId);
    setRightPanelTab('overview');
  }, [handleOpenTab, activeWorkspaceId]);

  const handleProjectSelect = useCallback((projectId: string, workspaceId: string) => {
    setTabState(prev => openProjectTab(prev, projectId, workspaceId));
    setCenterView(null);
    setRightPanelTab('overview');
  }, []);

  const handleFavoriteSelect = useCallback((item: FavoriteItem) => {
    if (item.type === 'agent') {
      setActiveAgentId(item.id);
      handleOpenTab('chat', activeWorkspaceId);
      setRightPanelTab('overview');
    } else if (item.type === 'project') {
      const project = getProject(item.id);
      if (project) {
        handleProjectSelect(project.id, project.workspaceId);
      }
    }
  }, [handleOpenTab, activeWorkspaceId, handleProjectSelect]);

  const handleWizardAction = useCallback((actionId: string) => {
    if (actionId === 'open-project') {
      handleOpenTab('projects', activeWorkspaceId);
    } else if (actionId === 'view-agents') {
      setCenterView('agents');
    }
  }, [handleOpenTab, activeWorkspaceId]);

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
        currentView={centerView ?? activeTab?.type ?? 'home'}
        onAgentSelect={handleAgentSelect}
        onProjectClick={handleProjectSelect}
      />
      <CenterWorkspace
        tabs={tabState.tabs}
        activeTabId={tabState.activeTabId}
        workspaceMap={workspaceMap}
        centerView={centerView}
        activeWorkspaceId={activeWorkspaceId}
        activeAgentId={activeAgentId}
        selectedTicketId={activeTab?.selectedTicketId ?? null}
        hasData={hasData}
        onTabClick={handleSelectTab}
        onTabClose={handleCloseTab}
        onTicketSelect={handleTicketSelect}
        onAgentSelect={handleAgentSelect}
        onProjectSelect={handleProjectSelect}
        onAction={handleWizardAction}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        context={rightPanelContext}
        tab={currentRightPanelTab}
        ticketId={activeTab?.selectedTicketId ?? null}
        onTabChange={setRightPanelTab}
        onApproveAudit={approveAudit}
        onDenyAudit={denyAudit}
      />
    </div>
  );
}
