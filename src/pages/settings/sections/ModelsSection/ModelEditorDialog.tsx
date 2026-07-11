import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CircleNotchIcon, TrashIcon } from '@phosphor-icons/react';
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
import { configureCatalogModel } from '@/flows/settings/crud/configure-catalog-model';
import { addCustomModel } from '@/flows/settings/crud/add-custom-model';
import { deleteProvider } from '@/flows/settings/crud/delete-provider';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import type { CatalogModel } from './catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';

type Mode = 'catalog' | 'custom';

interface ModelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  catalogEntry?: CatalogModel;
  existingModel?: ModelEntry;
  existingProvider?: ProviderEntry;
}

export function ModelEditorDialog({
  open,
  onOpenChange,
  onSaved,
  catalogEntry,
  existingModel,
  existingProvider,
}: ModelEditorDialogProps) {
  const mode: Mode = catalogEntry ? 'catalog' : 'custom';
  const showBaseUrl = mode === 'catalog'
    ? catalogEntry!.showBaseUrl
    : true;

  const initialProvider = mode === 'catalog'
    ? catalogEntry!.provider
    : (existingModel?.provider ?? '');
  const initialModelName = mode === 'catalog'
    ? catalogEntry!.name
    : (existingModel?.name ?? '');
  const initialBaseUrl = existingProvider?.baseUrl
    ?? (mode === 'catalog' ? catalogEntry!.baseUrl : 'https://');
  const initialKey = existingProvider?.apiKey ?? '';

  const [provider, setProvider] = React.useState(initialProvider);
  const [modelName, setModelName] = React.useState(initialModelName);
  const [baseUrl, setBaseUrl] = React.useState(initialBaseUrl);
  const [apiKey, setApiKey] = React.useState(initialKey);
  const [phase, setPhase] = React.useState<'idle' | 'saving' | 'removing'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setProvider(initialProvider);
    setModelName(initialModelName);
    setBaseUrl(initialBaseUrl);
    setApiKey(initialKey);
    setPhase('idle');
    setError(null);
  }, [open, initialProvider, initialModelName, initialBaseUrl, initialKey]);

  const isEditing = Boolean(existingModel) || Boolean(existingProvider);

  const canSubmit =
    phase === 'idle' &&
    provider.trim().length > 0 &&
    modelName.trim().length > 0 &&
    apiKey.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('saving');

    const input = {
      provider: provider.trim(),
      modelName: modelName.trim(),
      baseUrl: showBaseUrl ? baseUrl.trim() : undefined,
      apiKey: apiKey.trim(),
    };

    const result = mode === 'catalog'
      ? await configureCatalogModel(input)
      : await addCustomModel(input);

    if (result.ok) {
      onSaved?.();
      onOpenChange(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to save');
    }
  };

  const onRemove = async () => {
    if (!isEditing) return;
    setPhase('removing');
    setError(null);

    try {
      if (existingModel && !catalogEntry && existingModel.isCustom) {
        await deleteModel(existingModel.id);
      }
      await deleteProvider(provider.trim());
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setPhase('idle');
      const message = err instanceof Error ? err.message : 'Failed to remove';
      setError(message);
    }
  };

  const submitting = phase !== 'idle';
  const submitLabel = (() => {
    if (phase === 'saving') return isEditing ? 'Saving…' : 'Adding…';
    if (phase === 'removing') return 'Removing…';
    return isEditing ? 'Save changes' : 'Add model';
  })();

  const heading = mode === 'catalog'
    ? catalogEntry!.name
    : isEditing
      ? 'Edit model'
      : 'Add model';

  const description = mode === 'catalog'
    ? `Save the API key for ${catalogEntry!.provider} to enable this model in chat.`
    : isEditing
      ? 'Update or remove this model.'
      : 'Add a custom model not in the default catalog.';

  const keyLabel = mode === 'catalog'
    ? `${catalogEntry!.provider} ${catalogEntry!.keyLabel}`
    : 'API Key';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-sidebar border border-sidebar-border text-sidebar-foreground p-6 gap-6">
        <DialogHeader className="gap-2 pb-3 border-b border-sidebar-border">
          <DialogTitle className="text-sidebar-foreground">{heading}</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/60">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="me-provider" className="text-sidebar-foreground">
              Provider<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="me-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={mode === 'catalog'}
              autoFocus={mode === 'custom'}
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="me-model" className="text-sidebar-foreground">
              Model<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="me-model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={mode === 'catalog'}
              required
              className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
            />
          </div>

          {showBaseUrl && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="me-baseurl" className="text-sidebar-foreground">
                Base URL
              </Label>
              <Input
                id="me-baseurl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="me-key" className="text-sidebar-foreground">
              {keyLabel}<span className="text-destructive ml-0.5">*</span>
            </Label>
            <PasswordInput
              id="me-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
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
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={onRemove}
                disabled={submitting}
                className="text-destructive hover:text-destructive mr-auto"
              >
                <Icon icon={TrashIcon} className="size-3.5" />
                Remove
              </Button>
            ) : null}
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
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
