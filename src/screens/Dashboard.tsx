import { useState } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace, type CenterView } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveEmployee } from '@/components/left-nav/ActiveSection';
import { listWorkspaces } from '@/data/workspaces/store';
import { listProjectAgents } from '@/data/projects/store';
import { listFavorites } from '@/data/favorites/store';
import { listEmployees, approveAudit, denyAudit } from '@/data/employees/store';
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
  const [centerView, setCenterView] = useState<CenterView>('home');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('superhive');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'overview' | 'manage' | 'inbox'>('overview');

  const workspaces_data = listWorkspaces();
  const currentWorkspace = workspaces_data.find(w => w.id === activeWorkspaceId) ?? workspaces_data[0] ?? { id: '1', name: 'My Workspace', initials: 'MW', avatarColor: 'bg-chart-1' };
  const favorites_data = listFavorites();
  const workspaceAgents = listProjectAgents(activeWorkspaceId);
  const workspaceAgentNames = new Set(workspaceAgents.map(a => a.name));
  const employees_data = toActiveEmployee(
    listEmployees().filter(e => workspaceAgentNames.has(e.name))
  );

  const handleNavItemClick = (id: string) => {
    if (id === 'home' || id === 'projects' || id === 'employees' || id === 'tickets' || id === 'communications') {
      setCenterView(id as CenterView);
    }
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
  };

  const handleEmployeeSelect = (id: string) => {
    setActiveEmployeeId(id);
    setCenterView('employees');
  };

  const handleTicketSelect = (id: string) => {
    setSelectedTicketId(id);
    setRightPanelTab('inbox');
  };

  const handleFavoriteSelect = (item: FavoriteItem) => {
    if (item.type === 'employee') {
      setActiveEmployeeId(item.id);
      setCenterView('employees');
    } else if (item.type === 'project') {
      const wsId = workspaces_data.find(w => w.id === item.id)?.id;
      if (wsId) setActiveWorkspaceId(wsId);
      setCenterView('projects');
    }
  };

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
        onActiveTaskClick={(id) => setSelectedTicketId(id)}
        onNavItemClick={handleNavItemClick}
        currentView={centerView}
        onEmployeeSelect={handleEmployeeSelect}
      />
      <CenterWorkspace
        view={centerView}
        workspaceId={activeWorkspaceId}
        activeEmployeeId={activeEmployeeId}
        onTicketSelect={handleTicketSelect}
        onEmployeeSelect={handleEmployeeSelect}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        employeeId={activeEmployeeId}
        tab={rightPanelTab}
        ticketId={selectedTicketId}
        onTabChange={setRightPanelTab}
        onApproveAudit={approveAudit}
        onDenyAudit={denyAudit}
      />
    </div>
  );
}
