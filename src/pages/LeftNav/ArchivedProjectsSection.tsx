/**
 * Collapsible Archived section in the left sidebar — lists projects with status='ARCHIVED'.
 * Hidden entirely when there are no archived projects.
 */
import { useState } from 'react';
import { Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

export type ArchivedProjectSummary = {
  id: string;
  workspaceId: string;
  title: string;
  color: string;
};

type ArchivedProjectsSectionProps = {
  projects: ArchivedProjectSummary[];
  onProjectClick?: (projectId: string, workspaceId: string) => void;
  selectedProjectId?: string;
};

/**
 * Collapsible Archived section — only renders when there is at least one archived project.
 * Defaults to collapsed. Each row shows the project's color swatch and title; clicking
 * invokes onProjectClick to open the project in the center panel.
 *
 * @param projects - Archived projects to display (filtering happens in the parent)
 * @param onProjectClick - Called when a row is clicked
 * @param selectedProjectId - Currently selected project id for highlight
 */
export function ArchivedProjectsSection({
  projects,
  onProjectClick,
  selectedProjectId,
}: ArchivedProjectsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        ) : (
          <ChevronRight size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        )}
        <Archive size={12} strokeWidth={STROKE_WIDTH} className="shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">Archived</span>
        <span className="text-[10px] text-muted-foreground font-fustat">{projects.length}</span>
      </button>
      {isExpanded && (
        <div className="mt-0.5 ml-2 space-y-0.5">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onProjectClick?.(project.id, project.workspaceId)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-left text-xs">{project.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}