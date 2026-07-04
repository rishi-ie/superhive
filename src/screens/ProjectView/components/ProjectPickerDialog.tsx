import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { projects } from '@/api/projects';
import type { Project } from '@/storage/types';
import { ProjectCreateDialog } from './ProjectCreateDialog';

interface ProjectPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPickerDialog({
  open,
  onOpenChange,
}: ProjectPickerDialogProps) {
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (open) {
      projects.list().then(setProjectList);
    }
  }, [open]);

  function handleSelectProject(project: Project) {
    onOpenChange(false);
    navigate(`/projects/${project.id}`);
  }

  function handleCreateNew() {
    onOpenChange(false);
    setCreateOpen(true);
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Search projects..." autoFocus />
        <CommandList>
          <CommandEmpty>
            No projects yet — pick 'Create new project…' below.
          </CommandEmpty>

          <CommandGroup heading="Projects">
            {projectList.map((project) => (
              <CommandItem
                key={project.id}
                value={project.id}
                onSelect={() => handleSelectProject(project)}
                className="flex items-center gap-2"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#2563eb]/20">
                  <FolderOpen className="size-3 text-[#2563eb]" />
                </span>
                <span className="flex-1 truncate font-medium">{project.name}</span>
                {project.description && (
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {project.description}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup>
            <CommandItem
              value="__create__"
              onSelect={handleCreateNew}
              className="flex items-center gap-2"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-accent">
                <Plus className="size-3" />
              </span>
              <span className="font-medium">Create new project…</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setCreateOpen(false);
          navigate(`/projects/${project.id}`);
        }}
      />
    </>
  );
}
