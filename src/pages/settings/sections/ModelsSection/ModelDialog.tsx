import * as React from 'react';
import { Icon } from "@/components/ui/icon";
import { CircleNotchIcon } from "@phosphor-icons/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addModel } from '@/flows/settings/crud/add-model';
import { listProviders } from '@/flows/settings/crud/list-providers';
import { listModels } from '@/flows/settings/crud/list-models';
import type { ModelEntry, ProviderEntry } from '@/types/electron';

interface ModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (models: ModelEntry[]) => void;
}

type Phase = 'idle' | 'saving';

export function ModelDialog({ open, onOpenChange, onSaved }: ModelDialogProps) {
  const [providers, setProviders] = React.useState<Record<string, ProviderEntry>>({});
  const [provider, setProvider] = React.useState<string>('');
  const [name, setName] = React.useState('');
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setProvider('');
    setName('');
    setPhase('idle');
    setError(null);
    listProviders()
      .then((all) => {
        setProviders(all);
        const first = Object.keys(all)[0];
        if (first) setProvider(first);
      })
      .catch(() => undefined);
  }, [open]);

  const providerOptions = React.useMemo(
    () => Object.keys(providers).sort(),
    [providers],
  );

  const canSubmit =
    phase === 'idle' && provider.trim().length > 0 && name.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('saving');
    const result = await addModel({ provider: provider.trim(), name: name.trim() });
    if (result.ok) {
      const models = await listModels();
      onSaved?.(models);
      onOpenChange(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to add model');
    }
  };

  const submitting = phase !== 'idle';
  const buttonLabel = phase === 'saving' ? 'Adding…' : 'Add model';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-sidebar border border-sidebar-border text-sidebar-foreground p-6 gap-6">
        <DialogHeader className="gap-2 pb-3 border-b border-sidebar-border">
          <DialogTitle className="text-sidebar-foreground">Add model</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/60">
            Add a custom model not in the default catalog.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider" className="text-sidebar-foreground">
              Provider<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="model-provider" className="bg-input/30 border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No providers configured
                  </SelectItem>
                ) : (
                  providerOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {providerOptions.length === 0 && (
              <span className="text-xs text-sidebar-foreground/50">
                Add a provider first.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model-name" className="text-sidebar-foreground">
              Model name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="model-name"
              placeholder="claude-opus-4-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
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
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
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