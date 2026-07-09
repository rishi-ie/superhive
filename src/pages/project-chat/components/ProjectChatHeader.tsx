import type { Project } from '@/storage/types';
import type { Agent } from '@/storage/types';

interface ProjectChatHeaderProps {
  project: Project;
  members: Agent[];
}

export function ProjectChatHeader({ project, members }: ProjectChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-foreground">{project.name}</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-medium text-sidebar-primary">
            Project Agent
          </span>
          <span className="text-[11px] text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}