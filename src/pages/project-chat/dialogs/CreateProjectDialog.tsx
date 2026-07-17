import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { CircleNotchIcon, FolderOpenIcon } from "@phosphor-icons/react";
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
import { prepareProject } from '@/flows/projects/crud/prepare-project';
import { usePreparingToast } from '@/components/common/PreparingToast';
import { slugify } from '@/lib/slugify';

const DEFAULT_PARENT_DIR = '~/.superhive/projects';
type SubmitPhase = 'idle' | 'preparing';

export function CreateProjectDialog() {
  const { open, setOpen } = useOpenCreateProject();
  const navigate = useNavigate();
  const toast = usePreparingToast();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [localPath, setLocalPath] = React.useState('');
  const [localPathTouched, setLocalPathTouched] = React.useState(false);
  const [phase, setPhase] = React.useState<SubmitPhase>('idle');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocalPath('');
    setLocalPathTouched(false);
    setPhase('idle');
    setValidationError(null);
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

  const onSubmit = React.useCallback(async () => {
    if (phase !== 'idle') return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setValidationError('Project name is required')
      return
    }

    setValidationError(null)
    setPhase('preparing')

    const toastId = toast.show({
      title: `Preparing "${trimmedName}"…`,
    })

    const result = await prepareProject({
      name: trimmedName,
      description: description.trim() || undefined,
      localPath: localPath.trim() || undefined,
    })

    if (result.ok) {
      toast.dismiss(toastId)
      setPhase('idle')
      setOpen(false)
      navigate(`/projects/${result.project.id}`)
      return
    }

    setPhase('idle')

    if (result.reason === 'coordinator-timeout' && result.detail === 'runtime') {
      toast.update(toastId, {
        variant: 'error',
        title: `Couldn't prepare "${trimmedName}"`,
        description: result.message ?? 'The coordinator runtime did not finish booting in time.',
        actions: [
          { label: 'Retry', onClick: () => { void onSubmit() } },
          { label: 'Dismiss', onClick: () => toast.dismiss(toastId) },
        ],
      })
      return
    }

    toast.update(toastId, {
      variant: 'error',
      title: `Couldn't prepare "${trimmedName}"`,
      description: result.message,
      actions: [
        { label: 'Retry', onClick: () => { void onSubmit() } },
        { label: 'Dismiss', onClick: () => toast.dismiss(toastId) },
      ],
    })
  }, [phase, name, description, localPath, toast, setOpen, navigate])

  const submitting = phase !== 'idle';
  const buttonLabel = phase === 'preparing' ? 'Preparing Project…' : 'Create Project';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return
        setOpen(next)
      }}
    >
      <DialogContent className="sm:max-w-lg bg-sidebar border border-sidebar-border text-sidebar-foreground p-card gap-6">
        <DialogHeader className="gap-stack pb-3 border-b border-sidebar-border">
          <DialogTitle className="text-sidebar-foreground">New Project</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/60">
            Create a new project to group agents and tasks.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit()
          }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-stack">
            <Label htmlFor="project-name" className="text-sidebar-foreground">
              Project Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={submitting}
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
            />
          </div>

          <div className="flex flex-col gap-stack">
            <Label htmlFor="project-folder" className="text-sidebar-foreground">
              Project Folder
            </Label>
            <div className="relative">
              <Icon
                icon={FolderOpenIcon}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/40 pointer-events-none"
              />
              <Input
                id="project-folder"
                placeholder="~/.superhive/projects/my-project"
                value={localPath}
                onChange={handleLocalPathChange}
                disabled={submitting}
                className="pl-9 font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
              />
            </div>
            <span className="text-xs text-sidebar-foreground/50">
              Auto-suggested from project name. An agent will be created inside this folder.
            </span>
          </div>

          <div className="flex flex-col gap-stack">
            <Label htmlFor="project-description" className="text-sidebar-foreground">
              Description
            </Label>
            <Textarea
              id="project-description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="min-h-[80px] resize-none bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
            />
          </div>

          {validationError && (
            <p
              role="alert"
              className="rounded-button border border-destructive/30 bg-destructive/10 px-button-x py-button-y text-xs text-destructive"
            >
              {validationError}
            </p>
          )}

          <DialogFooter className="gap-stack">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="border-sidebar-border text-sidebar-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={!canSubmit}>
              {submitting && <Icon icon={CircleNotchIcon} className="size-3.5 animate-spin" />}
              {buttonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
