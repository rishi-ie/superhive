import { useState } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace, type CenterView } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import type { ActiveEmployee } from '@/components/left-nav/ActiveSection';
import { listWorkspaces, getCurrentWorkspace } from '@/data/workspaces/store';
import { listFavorites } from '@/data/favorites/store';
import { listEmployees } from '@/data/employees/store';

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

type LeftNavView = 'home' | 'projects' | 'employees' | 'tickets' | 'communications';

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [centerView, setCenterView] = useState<CenterView>('home');

  const workspaces_data = listWorkspaces();
  const currentWorkspace = getCurrentWorkspace();
  const favorites_data = listFavorites();
  const employees_data = toActiveEmployee(listEmployees());

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        onSettingsClick={() => onNavigate('settings')}
        workspaces={workspaces_data}
        currentWorkspace={currentWorkspace}
        favorites={favorites_data}
        activeEmployees={employees_data}
        currentView={centerView}
        onNavItemClick={(id) => {
          if (id === 'home' || id === 'projects' || id === 'employees' || id === 'tickets' || id === 'communications') {
            setCenterView(id as CenterView);
          }
        }}
      />
      <CenterWorkspace
        view={centerView}
        onAction={(actionId) => {
          if (actionId === 'skip') {
            setCenterView('home');
          }
        }}
      />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
      />
    </div>
  );
}
