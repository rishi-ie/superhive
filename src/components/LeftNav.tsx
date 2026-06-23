import { useRef, useEffect } from 'react';
import { LeftNavHeader } from './left-nav/LeftNavHeader';
import { TeamSelector, type Workspace } from './left-nav/TeamSelector';
import { ActiveSection, type ActiveEmployee } from './left-nav/ActiveSection';
import { FavoritesSection, type FavoriteItem } from './left-nav/FavoritesSection';
import { AccordionCore } from './left-nav/AccordionCore';
import { Utilities } from './left-nav/Utilities';

type LeftNavProps = {
  width: number;
  onWidthChange: (width: number) => void;
  workspaces?: Workspace[];
  currentWorkspace?: Workspace;
  favorites?: FavoriteItem[];
  activeEmployees?: ActiveEmployee[];
  activeTasks?: { id: string; title: string; assignedTo?: string }[];
  notificationCount?: number;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onSettingsClick?: () => void;
  onFavoritesItemClick?: (id: string) => void;
  onActiveEmployeeClick?: (id: string) => void;
  onActiveTaskClick?: (id: string) => void;
  onNavItemClick?: (id: string) => void;
  currentView?: string;
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
  onWorkspaceSelect,
  onSettingsClick,
  onFavoritesItemClick,
  onActiveEmployeeClick,
  onActiveTaskClick,
  onNavItemClick,
  currentView,
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

        <ActiveSection
          employees={activeEmployees}
          tasks={activeTasks}
          onEmployeeClick={onActiveEmployeeClick}
          onTaskClick={onActiveTaskClick}
        />
        <FavoritesSection
          items={favorites}
          onItemClick={onFavoritesItemClick}
        />

        <div className="border-t border-sidebar-border/60 mx-2" />

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AccordionCore currentView={currentView} onItemClick={onNavItemClick} />
        </div>

        <Utilities onSettingsClick={onSettingsClick} />
      </div>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
    </>
  );
}