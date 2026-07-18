/**
 * Empty state for the projects route — shown when there are zero projects.
 * Mirror of `EmptyAgentsState`. Triggers the global CreateProjectDialog via
 * `useOpenCreateProject`.
 */

import { Icon } from "@/components/ui/icon";
import { FolderOpenIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';

export function EmptyProjectsState() {
  const { setOpen } = useOpenCreateProject();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon icon={FolderOpenIcon} className="size-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-gap-tight">
        <h2 className="text-base font-medium text-foreground">No projects yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first project to group agents and tasks.
        </p>
      </div>

      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-list-item"
      >
        <Icon icon={PlusIcon} className="size-3.5" />
        New project
      </Button>
    </div>
  );
}
