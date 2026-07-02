/**
 * Cross-project agent view — shows all projects an agent is on.
 */
import { Folder, ArrowRight } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listAgentProjects } from '@/data/project_agents/store';
import { getProject } from '@/data/projects/store';

type AgentProjectsViewProps = {
  agentId: string;
  onProjectClick?: (projectId: string, workspaceId: string) => void;
};

export function AgentProjectsView({ agentId, onProjectClick }: AgentProjectsViewProps) {
  const rows = listAgentProjects(agentId);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 p-6">
        <Folder size={32} strokeWidth={STROKE_WIDTH} />
        <p className="text-sm">No projects yet</p>
        <p className="text-[10px]">Add this agent to a project to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-foreground">All projects</h2>
      <p className="text-[11px] text-muted-foreground">
        Projects this agent is a member of.
      </p>
      <div className="flex flex-col gap-1.5 mt-2">
        {rows.map((row) => {
          const project = row.projectId ? getProject(row.projectId) : undefined;
          return (
            <button
              key={`${row.projectId}-${row.agentId}`}
              onClick={() => {
                if (project && onProjectClick) onProjectClick(project.id, project.workspaceId);
              }}
              className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint text-left"
            >
              <Folder size={14} strokeWidth={STROKE_WIDTH} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {project?.title ?? row.projectId}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{row.role ?? 'Member'}</div>
              </div>
              <ArrowRight size={12} strokeWidth={STROKE_WIDTH} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
