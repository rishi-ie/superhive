import { useState } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';
import { workspaces, currentWorkspace } from '@/data/mock/workspaces';
import { favorites } from '@/data/mock/favorites';
import { activeEmployees } from '@/data/mock/employees';
import { activeTasks } from '@/data/mock/tasks';
import { notifications } from '@/data/mock/notifications';

type DashboardProps = {
  leftWidth: number;
  rightWidth: number;
  onLeftWidthChange: (width: number) => void;
  onRightWidthChange: (width: number) => void;
  onNavigate: (page: Page) => void;
};

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  const [notificationCount] = useState(notifications.filter((n) => !n.read).length);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        onSettingsClick={() => onNavigate('settings')}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        favorites={favorites}
        activeEmployees={activeEmployees}
        activeTasks={activeTasks}
        notificationCount={notificationCount}
      />
      <CenterWorkspace />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
        notifications={notifications}
      />
    </div>
  );
}
