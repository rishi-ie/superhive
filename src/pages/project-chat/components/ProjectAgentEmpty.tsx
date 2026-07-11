/**
 * Empty state for the project route — shown when no `projectId` is in the URL.
 * Forked conceptually from `AgentEmpty` so project-chat can evolve independently.
 */

import { Icon } from "@/components/ui/icon";
import { FolderOpenIcon } from "@phosphor-icons/react";
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';
import { Button } from '@/components/ui/button';
import { PlusIcon } from "@phosphor-icons/react";

export function ProjectAgentEmpty() {
  const { setOpen } = useOpenCreateProject();
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-gap-loose px-6 text-center">
        <div className="rounded-full bg-muted/40 p-card">
          <Icon icon={FolderOpenIcon} className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium text-foreground">No project selected</h2>
        <p className="text-sm text-muted-foreground">
          Pick a project from the sidebar, or create a new one to begin.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} className="mt-1 gap-gap-tight.5">
          <Icon icon={PlusIcon} className="size-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}