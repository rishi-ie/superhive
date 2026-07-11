import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { FolderIcon, CircleNotchIcon } from "@phosphor-icons/react";
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
import { slugify } from '@/lib/slugify';

const DEFAULT_PARENT_DIR = '~/.superhive/agents';

type SubmitPhase = 'idle' | 'creating';

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
    setFolderName(slugify(name));
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
    setPhase('creating');
    const result = await createAgent(
      {
        name: name.trim(),
        folderName: folderName.trim(),
        parentDir: parentDir.trim(),
      },
      navigate,
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
    phase === 'creating' ? 'Creating Agent…' : 'Create Agent';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-sidebar border border-sidebar-border text-sidebar-foreground p-card gap-6">
        <DialogHeader className="gap-stack pb-3 border-b border-sidebar-border">
          <DialogTitle className="text-sidebar-foreground">New Agent</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/60">
            Create a new agent in your local workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-stack">
            <Label htmlFor="agent-name" className="text-sidebar-foreground">
              Agent Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-name"
              placeholder="Backend Engineer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
            />
          </div>

          <div className="flex flex-col gap-stack">
            <Label htmlFor="agent-folder" className="text-sidebar-foreground">
              Agent Folder Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-folder"
              placeholder="backend-engineer"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value.toLowerCase())}
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
            <span className="text-xs text-sidebar-foreground/50">
              Lowercase letters, digits, hyphens. Used as the directory name.
            </span>
          </div>

          <div className="flex flex-col gap-stack">
            <Label htmlFor="agent-parent" className="text-sidebar-foreground">
              Parent Directory<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="agent-parent"
              placeholder="~/.superhive/agents"
              value={parentDir}
              onChange={(e) => setParentDir(e.target.value)}
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
          </div>

          {fullPath && (
            <div
              className={cn(
                'flex items-center gap-stack rounded-button border border-sidebar-border bg-sidebar-accent/30 px-button-x py-button-y text-xs text-sidebar-foreground/60'
              )}
            >
              <Icon icon={FolderIcon} className="size-3.5 flex-shrink-0" />
              <span className="font-mono truncate">{fullPath}</span>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-button border border-destructive/30 bg-destructive/10 px-button-x py-button-y text-xs text-destructive"
            >
              {error}
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
