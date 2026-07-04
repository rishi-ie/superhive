import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projects } from '@/api/projects';
import type { Project } from '@/storage/types';
import { ProjectChatHeader } from './components/ProjectChatHeader';
import { ProjectEmptyState } from './components/ProjectEmptyState';
import { ProjectPickerDialog } from './components/ProjectPickerDialog';
import { ChatComposer } from '@/screens/ChatView/components/ChatComposer';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';

export function ProjectChatView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    projects.get(projectId).then((p) => {
      if (!p) {
        setNotFound(true);
      } else {
        setNotFound(false);
        setProject(p);
      }
    });
  }, [projectId]);

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#141414] p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <FolderOpen className="size-6 text-[#2563eb]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-medium text-foreground">Project not found</div>
          <div className="text-xs text-muted-foreground">
            This project may have been deleted.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          <FolderOpen className="size-3.5" /> Browse projects
        </Button>
        <ProjectPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141414]">
        <div className="flex size-6 items-center justify-center">
          <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#141414]">
      <ProjectChatHeader project={project} />
      <ProjectEmptyState projectName={project.name} />
      <ChatComposer />
    </div>
  );
}
