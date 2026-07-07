import * as React from 'react';
import { HugeiconsIcon } from "@/components/ui/icon";
import { Loading01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';
import { createProject } from '@/flows/projects/crud/create-project';
import { slugify } from '@/lib/slugify';

const DEFAULT_PARENT_DIR = '~/.superhive/projects';
type SubmitPhase = 'idle' | 'creating';

export function CreateProjectDialog() {
  const { open, setOpen } = useOpenCreateProject();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [localPath, setLocalPath] = React.useState('');
  const [localPathTouched, setLocalPathTouched] = React.useState(false);
  const [phase, setPhase] = React.useState<SubmitPhase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocalPath('');
    setLocalPathTouched(false);
    setPhase('idle');
    setError(null);
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  React.useEffect(() => {
    if (!name.trim()) {
      setLocalPath(DEFAULT_PARENT_DIR + '/');
      return;
    }
    if (!localPathTouched) {
      const slug = slugify(name);
      setLocalPath(`${DEFAULT_PARENT_DIR}/${slug || 'project'}`);
    }
  }, [name, localPathTouched]);

  const handleLocalPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPathTouched(true);
    setLocalPath(e.target.value);
  };

  const canSubmit = phase === 'idle' && name.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('creating');
    const result = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      localPath: localPath.trim() || undefined,
    });
    if (result.ok) {
      setOpen(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to create project');
    }
  };

  const submitting = phase !== 'idle';
  const buttonLabel = phase === 'creating' ? 'Creating Project\u2026' : 'Create Project';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a new project to group agents and tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">
              Project Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-folder">
              Project Folder
            </Label>
            <div className="relative">
              <HugeiconsIcon
                icon={FolderOpenIcon}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              />
              <Input
                id="project-folder"
                placeholder="~/.superhive/projects/my-project"
                value={localPath}
                onChange={handleLocalPathChange}
                className="pl-9 font-mono text-xs"
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              Auto-suggested from project name. Agents connected to this project will use it as their workspace center.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">
              Description
            </Label>
            <Textarea
              id="project-description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />}
              {buttonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
