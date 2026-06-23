import { useState, useMemo, useCallback } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace, type CenterView } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveEmployee } from '@/components/left-nav/ActiveSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents, listTickets, getProject } from '@/data/projects/store';
import { listFavorites } from '@/data/favorites/store';
import { listEmployees, approveAudit, denyAudit } from '@/data/employees/store';
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

function toActiveEmployee(employees: ReturnType<typeof listEmployees>): ActiveEmployee[] {
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    status: e.status === 'EXECUTING' || e.status === 'COMPILING' || e.status === 'AWAITING_HUMAN'
      ? 'active'
      : e.status === 'IDLE'
      ? 'idle'
      : 'busy',
    currentTask: e.activeTask,
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
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTabId>('overview');

  const workspaces_data = listWorkspaces();
  const currentWorkspace = workspaces_data.find(w => w.id === activeWorkspaceId) ?? workspaces_data[0] ?? { id: '1', name: 'My Workspace', initials: 'MW', avatarColor: 'bg-chart-1' };
  const favorites_data = listFavorites();
  const workspaceAgents = listProjectAgents(activeWorkspaceId);
  const workspaceAgentNames = new Set(workspaceAgents.map(a => a.name));
  const employees_data = toActiveEmployee(
    listEmployees().filter(e => workspaceAgentNames.has(e.name))
  );

  const workspaceMap = useMemo(
    () => Object.fromEntries(listWorkspaces().map(w => [w.id, w.name])),
    [],
  );

  const hasData = workspaces_data.length > 0 || listEmployees().length > 0;

  const activeTasks = listTickets(activeWorkspaceId)
    .filter(t => t.status === 'EXECUTING')
    .map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedAgentId }));

  const activeTab = getActiveTab(tabState);

  const rightPanelContext = useMemo<RightPanelContext>(() => {
    if (!activeTab) return null;
    if (activeTab.type === 'chat' && activeEmployeeId) return { kind: 'employee', employeeId: activeEmployeeId };
    if (activeTab.type === 'tickets' && activeTab.selectedTicketId) return { kind: 'ticket', ticketId: activeTab.selectedTicketId };
    if (activeTab.type === 'project' && activeTab.selectedProjectId) return { kind: 'project', projectId: activeTab.selectedProjectId };
    if (activeTab.type === 'channel' && activeTab.selectedChannelId) return { kind: 'channel', channelId: activeTab.selectedChannelId };
    if (activeTab.type === 'chat') return { kind: 'employee', employeeId: activeEmployeeId ?? '' };
    return null;
  }, [activeTab, activeEmployeeId]);

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
    if (id === 'employees' || id === 'universal-employees') { setCenterView('universal-employees'); return; }
    if (id === 'communications') { setCenterView('communications'); return; }
    if (id === 'projects' || id === 'universal-projects') { setCenterView('universal-projects'); return; }
    if (id === 'tickets') { setCenterView('tickets'); return; }
    if (id === 'chat') { handleOpenTab('chat', activeWorkspaceId); }
  }, [handleOpenTab, activeWorkspaceId]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    handleOpenTab('projects', workspace.id);
  }, [handleOpenTab]);

  const handleEmployeeSelect = useCallback((id: string) => {
    setActiveEmployeeId(id);
    handleOpenTab('chat', activeWorkspaceId);
    setRightPanelTab('overview');
  }, [handleOpenTab, activeWorkspaceId]);

  const handleProjectSelect = useCallback((projectId: string, workspaceId: string) => {
    setTabState(prev => openProjectTab(prev, projectId, workspaceId));
    setCenterView(null);
    setRightPanelTab('overview');
  }, []);

  const handleFavoriteSelect = useCallback((item: FavoriteItem) => {
    if (item.type === 'employee') {
      setActiveEmployeeId(item.id);
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
    } else if (actionId === 'view-employees') {
      setCenterView('employees');
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
        activeEmployees={employees_data}
        activeTasks={activeTasks}
        onWorkspaceSelect={handleWorkspaceSelect}
        onSettingsClick={() => onNavigate('settings')}
        onFavoritesItemClick={handleFavoriteSelect}
        onActiveEmployeeClick={handleEmployeeSelect}
        onActiveTaskClick={(id) => handleTicketSelect(id)}
        onNavItemClick={handleNavItemClick}
        currentView={centerView ?? activeTab?.type ?? 'home'}
        onEmployeeSelect={handleEmployeeSelect}
        onProjectClick={handleProjectSelect}
      />
      <CenterWorkspace
        tabs={tabState.tabs}
        activeTabId={tabState.activeTabId}
        workspaceMap={workspaceMap}
        centerView={centerView}
        activeWorkspaceId={activeWorkspaceId}
        activeEmployeeId={activeEmployeeId}
        selectedTicketId={activeTab?.selectedTicketId ?? null}
        hasData={hasData}
        onTabClick={handleSelectTab}
        onTabClose={handleCloseTab}
        onTicketSelect={handleTicketSelect}
        onEmployeeSelect={handleEmployeeSelect}
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
