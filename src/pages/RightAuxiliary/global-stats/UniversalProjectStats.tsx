/**
 * Universal project stats across all workspaces — project count, ticket status breakdown.
 */
import type { Project } from '@/data/project/store';
import type { UniversalTicket } from '@/data/ticket/store';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';

type UniversalProjectStatsProps = {
  projects: Project[];
  universalTickets: UniversalTicket[];
  onProjectClick?: (id: string, workspaceId: string) => void;
};

/**
 * Universal project stats across all workspaces — project count, ticket status breakdown.
 * @param projects - All projects
 * @param universalTickets - All tickets for status aggregation
 * @param onProjectClick - Called when project is clicked
 */
export function UniversalProjectStats({ projects, universalTickets, onProjectClick }: UniversalProjectStatsProps) {
  const backlog = universalTickets.filter(t => t.status === 'BACKLOG').length;
  const executing = universalTickets.filter(t => t.status === 'EXECUTING').length;
  const review = universalTickets.filter(t => t.status === 'REVIEW').length;
  const merged = universalTickets.filter(t => t.status === 'MERGED').length;

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Executing" value={executing} color="text-chart-2" />
        <StatCard label="Review" value={review} color="text-chart-3" />
        <StatCard label="Merged" value={merged} />
      </div>

      <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded px-2 py-1.5">
        {backlog} backlog tickets across all workspaces
      </div>

      {onProjectClick && projects.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-1">
          <SectionLabel>Projects</SectionLabel>
          {projects.slice(0, 5).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onProjectClick(p.id, p.workspaceId)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-border/40 hover:bg-hover-tint transition-colors text-left"
            >
              <span className="text-xs text-foreground truncate">{p.title}</span>
              <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{p.workspaceId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
