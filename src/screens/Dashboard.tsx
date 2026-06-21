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
  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

  const workspaces_data = USE_MOCK_DATA ? workspaces : [];
  const favorites_data = USE_MOCK_DATA ? favorites : [];
  const employees_data = USE_MOCK_DATA ? activeEmployees : [];
  const tasks_data = USE_MOCK_DATA ? activeTasks : [];
  const notifications_data = USE_MOCK_DATA ? notifications : [];

  const [notificationCount] = USE_MOCK_DATA
    ? [notifications.filter((n) => !n.read).length]
    : [0];

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        onSettingsClick={() => onNavigate('settings')}
        workspaces={workspaces_data}
        currentWorkspace={USE_MOCK_DATA ? currentWorkspace : undefined}
        favorites={favorites_data}
        activeEmployees={employees_data}
        activeTasks={tasks_data}
        notificationCount={notificationCount}
      />
      <CenterWorkspace />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
      />
    </div>
  );
}
