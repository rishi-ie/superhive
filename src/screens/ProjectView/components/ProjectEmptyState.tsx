import { FolderOpen } from 'lucide-react';

interface ProjectEmptyStateProps {
  projectName: string;
}

export function ProjectEmptyState({ projectName }: ProjectEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <FolderOpen className="size-6 text-[#2563eb]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">
          No messages yet
        </div>
        <div className="text-xs text-muted-foreground">
          Send a message to start a session with {projectName}.
        </div>
      </div>
    </div>
  );
}
