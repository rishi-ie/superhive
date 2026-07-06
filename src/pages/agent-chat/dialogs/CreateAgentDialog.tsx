import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Loader2 } from 'lucide-react';
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
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import { createAgent } from '@/flows/agents/crud/create-agent';
import { cn } from '@/lib/utils';

const DEFAULT_PARENT_DIR = '~/.superhive/agents';

type SubmitPhase = 'idle' | 'cloning' | 'creating';

export function CreateAgentDialog() {
  const { open, setOpen } = useOpenCreateAgent();
  const navigate = useNavigate();

  const [name, setName] = React.useState('');
  const [folderName, setFolderName] = React.useState('');
  const [parentDir, setParentDir] = React.useState(DEFAULT_PARENT_DIR);
  const [phase, setPhase] = React.useState<SubmitPhase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName('');
      setFolderName('');
      setParentDir(DEFAULT_PARENT_DIR);
      setPhase('idle');
      setError(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (!name) {
      setFolderName('');
      return;
    }
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFolderName(slug);
  }, [name]);

  const fullPath = parentDir ? `${parentDir}/${folderName || '<folder-name>'}` : '';

  const canSubmit =
    phase === 'idle' &&
    name.trim().length > 0 &&
    /^[a-z0-9][a-z0-9-]*$/.test(folderName) &&
    parentDir.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const result = await createAgent(
      {
        name: name.trim(),
        folderName: folderName.trim(),
        parentDir: parentDir.trim(),
      },
      navigate,
      (p) => setPhase(p)
    );
    if (result.ok) {
      setOpen(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to create agent');
    }
  };

  const submitting = phase !== 'idle';
  const buttonLabel =
    phase === 'cloning'
      ? 'Cloning Manifest Pi…'
      : phase === 'creating'
        ? 'Creating Agent…'
        : 'Create Agent';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Agent</DialogTitle>
          <DialogDescription>
            Superhive will fetch the Manifest Pi template and bootstrap a new agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-name">
              Agent Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-name"
              placeholder="Backend Engineer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-folder">
              Agent Folder Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-folder"
              placeholder="backend-engineer"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value.toLowerCase())}
              required
            />
            <span className="text-[11px] text-muted-foreground">
              Lowercase letters, digits, hyphens. Used as the directory name.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-parent">
              Parent Directory<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-parent"
              placeholder="~/.superhive/agents"
              value={parentDir}
              onChange={(e) => setParentDir(e.target.value)}
              required
            />
          </div>

          {fullPath && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'
              )}
            >
              <Folder className="size-3.5 flex-shrink-0" />
              <span className="font-mono truncate">{fullPath}</span>
            </div>
          )}

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
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              {buttonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}