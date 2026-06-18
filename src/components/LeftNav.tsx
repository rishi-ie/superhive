import { useRef, useEffect } from 'react';
import { LeftNavHeader } from './left-nav/LeftNavHeader';
import { TeamSelector, type Workspace } from './left-nav/TeamSelector';
import { MainNavList } from './left-nav/PrimaryNavList';
import { FavoritesSection, type FavoriteItem } from './left-nav/FavoritesSection';
import { ActiveSection, type ActiveEmployee, type ActiveTask } from './left-nav/ActiveSection';
import { LeftNavFooter } from './left-nav/LeftNavFooter';

type LeftNavProps = {
  width: number;
  onWidthChange: (width: number) => void;
  workspaces?: Workspace[];
  currentWorkspace?: Workspace;
  favorites?: FavoriteItem[];
  activeEmployees?: ActiveEmployee[];
  activeTasks?: ActiveTask[];
  notificationCount?: number;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onFavoritesItemClick?: (id: string) => void;
  onActiveEmployeeClick?: (id: string) => void;
  onActiveTaskClick?: (id: string) => void;
  onNavItemClick?: (id: string) => void;
};

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export function LeftNav({
  width,
  onWidthChange,
  workspaces = [],
  currentWorkspace = { id: '1', name: 'My Workspace', initials: 'MW', avatarColor: 'bg-chart-1' },
  favorites = [],
  activeEmployees = [],
  activeTasks = [],
  notificationCount = 0,
  onWorkspaceSelect,
  onSettingsClick,
  onNotificationsClick,
  onFavoritesItemClick,
  onActiveEmployeeClick,
  onActiveTaskClick,
  onNavItemClick,
}: LeftNavProps) {
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
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
        className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/40"
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <div className="drag h-2 shrink-0" />
        <LeftNavHeader />
        <TeamSelector
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onWorkspaceSelect={onWorkspaceSelect}
          onSettingsClick={onSettingsClick}
        />
        <div className="flex-1 overflow-y-auto">
          <FavoritesSection
            items={favorites}
            onItemClick={onFavoritesItemClick}
          />
          <ActiveSection
            employees={activeEmployees}
            tasks={activeTasks}
            onEmployeeClick={onActiveEmployeeClick}
            onTaskClick={onActiveTaskClick}
          />
          <MainNavList onItemClick={onNavItemClick} />
        </div>
        <LeftNavFooter
          notificationCount={notificationCount}
          onSettingsClick={onSettingsClick}
          onNotificationsClick={onNotificationsClick}
        />
      </div>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
    </>
  );
}
