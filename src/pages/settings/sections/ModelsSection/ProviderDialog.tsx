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
import { PasswordInput } from '@/components/common/PasswordInput';
import { setProvider } from '@/flows/settings/crud/set-provider';
import { listProviders } from '@/flows/settings/crud/list-providers';
import { toast } from 'sonner';
import type { ProviderEntry } from '@/types/electron';

// Provider name format: lowercase slug with optional digits/underscore/dash.
// Mirrors the env-var -> provider derivation in
// `extensions/superhive-pi-truth/provider-map.ts::envVarToProvider` so that
// "minimax" and "MINIMAX_API_KEY" resolve to the same key.
const PROVIDER_NAME_PATTERN = /^[a-z0-9_-]+$/;

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSaved?: (providers: Record<string, ProviderEntry>) => void;
}

type Phase = 'idle' | 'saving';

export function ProviderDialog({
  open,
  onOpenChange,
  initialName,
  onSaved,
}: ProviderDialogProps) {
  const isEdit = Boolean(initialName);
  const [name, setName] = React.useState(initialName ?? '');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(initialName ?? '');
    setBaseUrl('');
    setApiKey('');
    setPhase('idle');
    setError(null);
    if (initialName) {
      listProviders()
        .then((all) => {
          const entry = all[initialName];
          if (entry) {
            setBaseUrl(entry.baseUrl ?? '');
            setApiKey(entry.apiKey ?? '');
          }
        })
        .catch(() => undefined);
    }
  }, [open, initialName]);

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0 && PROVIDER_NAME_PATTERN.test(trimmedName);
  const canSubmit = phase === 'idle' && isNameValid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      // Defensive guard for cases where the submit handler is reached
      // before the inline validation message can render.
      if (trimmedName.length === 0) {
        toast.error('Provider name is required');
      } else if (!isNameValid) {
        toast.error('Provider name must be lowercase letters, digits, underscores, or dashes');
      }
      return;
    }
    setError(null);
    setPhase('saving');
    const result = await setProvider({
      name: trimmedName,
      baseUrl: baseUrl.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
    });
    if (result.ok) {
      const providers = await listProviders();
      onSaved?.(providers);
      onOpenChange(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to save provider');
    }
  };

  const submitting = phase !== 'idle';
  const buttonLabel = isEdit
    ? phase === 'saving' ? 'Saving…' : 'Save'
    : phase === 'saving' ? 'Adding…' : 'Add provider';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-sidebar border border-sidebar-border text-sidebar-foreground p-6 gap-6">
        <DialogHeader className="gap-2 pb-3 border-b border-sidebar-border">
          <DialogTitle className="text-sidebar-foreground">
            {isEdit ? 'Edit provider' : 'Add provider'}
          </DialogTitle>
          <DialogDescription className="text-sidebar-foreground/60">
            Configure an LLM provider and its API key.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="provider-name" className="text-sidebar-foreground">
              Name<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="provider-name"
              placeholder="anthropic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              aria-invalid={trimmedName.length > 0 && !isNameValid}
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
            {trimmedName.length > 0 && !isNameValid ? (
              <span className="text-xs text-destructive">
                Lowercase letters, digits, underscores, or dashes only.
              </span>
            ) : (
              <span className="text-xs text-sidebar-foreground/50">
                Unique key used to identify the provider (e.g. anthropic, openai, my-local).
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="provider-base-url" className="text-sidebar-foreground">
              Base URL
            </Label>
            <Input
              id="provider-base-url"
              placeholder="https://api.anthropic.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
            <span className="text-xs text-sidebar-foreground/50">
              Optional. Leave blank for default provider URL.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="provider-api-key" className="text-sidebar-foreground">
              API Key
            </Label>
            <PasswordInput
              id="provider-api-key"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
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
              {submitting && <HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />}
              {buttonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}