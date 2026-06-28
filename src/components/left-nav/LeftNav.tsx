/**
 * Root left navigation panel — workspace selector, active agents, favorites, and accordion nav.
 */
import { useRef, useEffect } from 'react';
import { LeftNavHeader } from './LeftNavHeader';
import { TeamSelector, type Workspace } from './TeamSelector';
import { ActiveSection, type ActiveAgent } from './ActiveSection';
import { FavoritesSection, type FavoriteItem } from './FavoritesSection';
import { ArchivedProjectsSection, type ArchivedProjectSummary } from './ArchivedProjectsSection';
import { AccordionCore } from './AccordionCore';
import { Utilities } from './Utilities';

type LeftNavProps = {
  width: number;
  onWidthChange: (width: number) => void;
  workspaces?: Workspace[];
  currentWorkspace?: Workspace;
  favorites?: FavoriteItem[];
  activeAgents?: ActiveAgent[];
  archivedProjects?: ArchivedProjectSummary[];
  notificationCount?: number;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onSettingsClick?: () => void;
  onFavoritesItemClick?: (item: FavoriteItem) => void;
  onActiveAgentClick?: (id: string) => void;
  onAgentSelect?: (id: string) => void;
  onNavItemClick?: (id: string) => void;
  onProjectClick?: (projectId: string, workspaceId: string) => void;
  currentView?: string;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
};

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

/**
 * Root left navigation panel — workspace selector, active agents, favorites, and accordion nav.
 * @param width - Panel width in pixels
 * @param onWidthChange - Called when panel is resized
 * @param workspaces - Available workspaces for selector
 * @param currentWorkspace - Currently selected workspace
 * @param favorites - Favorite items to display
 * @param activeAgents - Active agents to display
 * @param archivedProjects - Archived projects displayed at the very bottom of the sidebar
 * @param onWorkspaceSelect - Called when workspace is selected
 * @param onSettingsClick - Called when settings is clicked
 * @param onFavoritesItemClick - Called when favorite item is clicked
 * @param onActiveAgentClick - Called when active agent is clicked
 * @param onAgentSelect - Called when agent is selected from accordion
 * @param onNavItemClick - Called when nav item is clicked
 * @param onProjectClick - Called when project is clicked
 * @param currentView - Current view identifier
 * @param onToggleLeftPanel - Called to toggle left panel
 * @param onToggleRightPanel - Called to toggle right panel
 */
export function LeftNav({
  width,
  onWidthChange,
  workspaces = [],
  currentWorkspace = { id: '1', name: 'My Workspace', initials: 'MW', avatarColor: 'bg-chart-1' },
  favorites = [],
  activeAgents = [],
  archivedProjects = [],
  onWorkspaceSelect,
  onSettingsClick,
  onFavoritesItemClick,
  onActiveAgentClick,
  onNavItemClick,
  onProjectClick,
  currentView,
  onAgentSelect,
  onToggleLeftPanel,
  onToggleRightPanel,
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
        <LeftNavHeader
          onToggleLeft={onToggleLeftPanel}
          onToggleRight={onToggleRightPanel}
        />
        <TeamSelector
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onWorkspaceSelect={onWorkspaceSelect}
          onSettingsClick={onSettingsClick}
        />

        <ActiveSection
          agents={activeAgents}
          onAgentClick={onActiveAgentClick}
        />
        <FavoritesSection
          items={favorites}
          onItemClick={onFavoritesItemClick}
        />

        <div className="border-t border-sidebar-border/60 mx-2" />

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AccordionCore currentView={currentView} onItemClick={onNavItemClick} onAgentClick={onAgentSelect} onProjectClick={onProjectClick} />
        </div>

        <Utilities onSettingsClick={onSettingsClick} />

        <ArchivedProjectsSection
          projects={archivedProjects}
          onProjectClick={onProjectClick}
        />
      </div>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
    </>
  );
}
