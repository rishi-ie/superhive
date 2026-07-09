/**
 * Empty state for the project route — shown when no `projectId` is in the URL.
 * Forked conceptually from `AgentEmpty` so project-chat can evolve independently.
 */

import { HugeiconsIcon } from "@/components/ui/icon";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';
import { Button } from '@/components/ui/button';
import { PlusSignIcon } from "@hugeicons/core-free-icons";

export function ProjectAgentEmpty() {
  const { setOpen } = useOpenCreateProject();
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
        <div className="rounded-full bg-muted/40 p-4">
          <HugeiconsIcon icon={FolderOpenIcon} className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium text-foreground">No project selected</h2>
        <p className="text-sm text-muted-foreground">
          Pick a project from the sidebar, or create a new one to begin.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} className="mt-1 gap-1.5">
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}