import * as React from 'react';
import { HugeiconsIcon } from "@/components/ui/icon";
import { Loading01Icon } from "@hugeicons/core-free-icons";
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

type SubmitPhase = 'idle' | 'creating';

export function CreateProjectDialog() {
  const { open, setOpen } = useOpenCreateProject();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [phase, setPhase] = React.useState<SubmitPhase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setPhase('idle');
      setError(null);
    }
  }, [open]);

  const canSubmit = phase === 'idle' && name.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('creating');
    const result = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
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
              placeholder="superhive"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
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
