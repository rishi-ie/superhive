import { Icon } from "@/components/ui/icon";
import { CaretRightIcon } from "@phosphor-icons/react";
import { TableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import type { Project } from '@/types/electron';
import { ProjectRowContextMenu } from './ProjectRowContextMenu';

interface ProjectListRowProps {
  project: Project;
  onRowNavigate: (projectId: string) => void;
  onOpenDelete: (projectId: string) => void;
}

export function ProjectListRow({
  project,
  onRowNavigate,
  onOpenDelete,
}: ProjectListRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowNavigate(project.id);
    }
  };

  const agentCount = project.agentIds.length;
  const agentsLabel =
    agentCount === 0
      ? 'No agents'
      : `${agentCount} ${agentCount === 1 ? 'agent' : 'agents'}`;

  const row = (
    <TableRow
      data-project-row={project.id}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Open ${project.name}`}
      className="group cursor-pointer"
    >
      <TableCell className="w-[260px]">
        <span className="truncate font-medium text-foreground text-sm">
          {project.name}
        </span>
      </TableCell>

      <TableCell>
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {agentsLabel}
        </span>
      </TableCell>

      <TableCell className="w-10 text-right">
        <Icon
          icon={CaretRightIcon}
          className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
        />
      </TableCell>
    </TableRow>
  );

  return (
    <ProjectRowContextMenu
      project={project}
      onOpenDelete={() => onOpenDelete(project.id)}
    >
      {row}
    </ProjectRowContextMenu>
  );
}
