import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  CopyIcon,
  FolderOpenIcon,
  TextOutdentIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { Project } from '@/types/electron';
import type { ReactNode } from 'react';
import { revealProject } from '@/flows/projects/crud';
import { goToProject } from '@/flows/navigation';
import { copyProjectId } from '@/flows/ui/copy-project-id';

interface ProjectRowContextMenuProps {
  project: Project;
  onOpenDelete: () => void;
  children: ReactNode;
}

export function ProjectRowContextMenu(props: ProjectRowContextMenuProps) {
  const navigate = useNavigate();
  const { project } = props;

  function copyId() {
    void copyProjectId(project.id);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {props.children}
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-56">
        <ContextMenuItem onSelect={() => goToProject(navigate, project.id)}>
          <TextOutdentIcon /> Open project
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={copyId}>
          <CopyIcon /> Copy project ID
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!project.localPath}
          onSelect={() => revealProject(project.id)}
        >
          <FolderOpenIcon /> Reveal in Finder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={props.onOpenDelete}>
          <TrashIcon /> Delete project
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
