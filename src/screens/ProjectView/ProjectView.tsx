import { FolderOpen } from 'lucide-react';
import { ChatView } from '@/screens/ChatView';
import { usePicker } from '@/providers/picker-provider';
import { useProjects } from '@/hooks/use-projects';

export function ProjectView() {
  const { selectedProjectId, selectedProjectName } = usePicker();
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141414] text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#141414] p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <FolderOpen className="size-6 text-[#2563eb]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-medium text-foreground">No project selected</div>
          <div className="text-xs text-muted-foreground">
            Click <span className="text-muted-foreground/70">Project view</span> in the sidebar to pick one.
          </div>
        </div>
      </div>
    );
  }

  return <ChatView category="project" agentName={selectedProjectName ?? projects.find(p => p.id === selectedProjectId)?.name ?? 'Project'} />;
}
