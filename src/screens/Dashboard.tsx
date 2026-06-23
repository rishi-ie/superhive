import { useState, useMemo, useCallback } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace, type CenterView } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveEmployee } from '@/components/left-nav/ActiveSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents } from '@/data/projects/store';
import { listFavorites } from '@/data/favorites/store';
import { listEmployees, approveAudit, denyAudit } from '@/data/employees/store';
import {
  makeInitialTabState,
  openTab as openTabOp,
  closeTab as closeTabOp,
  selectTab as selectTabOp,
  setTicketOnTab,
  getActiveTab,
} from '@/data/tabs/store';
import type { CenterTabType } from '@/data/tabs/interface';
import type { Workspace } from '@/data/workspaces/interface';
import type { FavoriteItem } from '@/data/favorites/interface';

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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('superhive');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'overview' | 'manage' | 'inbox'>('overview');

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

  const activeTab = getActiveTab(tabState);

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
    setRightPanelTab('inbox');
  }, [tabState.activeTabId]);

  const handleNavItemClick = useCallback((id: string) => {
    if (id === 'home') { setCenterView('home'); return; }
    if (id === 'employees') { setCenterView('employees'); return; }
    if (id === 'communications') { setCenterView('communications'); return; }
    if (id === 'projects' || id === 'tickets' || id === 'chat') {
      handleOpenTab(id as CenterTabType, activeWorkspaceId);
    }
  }, [handleOpenTab, activeWorkspaceId]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    handleOpenTab('projects', workspace.id);
  }, [handleOpenTab]);

  const handleEmployeeSelect = useCallback((id: string) => {
    setActiveEmployeeId(id);
    setCenterView('employees');
  }, []);

  const handleFavoriteSelect = useCallback((item: FavoriteItem) => {
    if (item.type === 'employee') {
      setActiveEmployeeId(item.id);
      setCenterView('employees');
    } else if (item.type === 'project') {
      handleOpenTab('projects', item.id);
    }
  }, [handleOpenTab]);

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
        activeTasks={[]}
        onWorkspaceSelect={handleWorkspaceSelect}
        onSettingsClick={() => onNavigate('settings')}
        onFavoritesItemClick={handleFavoriteSelect}
        onActiveEmployeeClick={handleEmployeeSelect}
        onActiveTaskClick={(id) => handleTicketSelect(id)}
        onNavItemClick={handleNavItemClick}
        currentView={centerView ?? activeTab?.type ?? 'home'}
        onEmployeeSelect={handleEmployeeSelect}
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
        onAction={handleWizardAction}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        employeeId={activeEmployeeId}
        tab={rightPanelTab}
        ticketId={activeTab?.selectedTicketId ?? null}
        onTabChange={setRightPanelTab}
        onApproveAudit={approveAudit}
        onDenyAudit={denyAudit}
      />
    </div>
  );
}
