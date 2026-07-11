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
import { configureCatalogProvider } from '@/flows/settings/crud/configure-catalog-provider';
import { addCustomModel } from '@/flows/settings/crud/add-custom-model';
import { deleteProvider } from '@/flows/settings/crud/delete-provider';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import type { CatalogProviderMeta } from './catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';

type Mode = 'catalog' | 'custom';

interface ModelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  catalogProvider?: CatalogProviderMeta;
  /** Curated model name to enable when the user saves in catalog mode. */
  catalogModelName?: string;
  existingModel?: ModelEntry;
  existingProvider?: ProviderEntry;
}

export function ModelEditorDialog({
  open,
  onOpenChange,
  onSaved,
  catalogProvider,
  catalogModelName,
  existingModel,
  existingProvider,
}: ModelEditorDialogProps) {
  const mode: Mode = catalogProvider ? 'catalog' : 'custom';
  const showBaseUrl = mode === 'catalog'
    ? catalogProvider!.showBaseUrl
    : true;

  const initialProvider = mode === 'catalog'
    ? catalogProvider!.name
    : (existingModel?.provider ?? '');
  const initialBaseUrl = existingProvider?.baseUrl
    ?? (mode === 'catalog' ? catalogProvider!.baseUrl : 'https://');
  const initialKey = existingProvider?.apiKey ?? '';
  const initialModelName = mode === 'custom'
    ? (existingModel?.name ?? '')
    : '';

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

  const hasExisting = mode === 'catalog'
    ? Boolean(existingProvider?.apiKey?.trim())
    : Boolean(existingModel);
  const isEditing = hasExisting;

  const canSubmit =
    phase === 'idle' &&
    provider.trim().length > 0 &&
    apiKey.trim().length > 0 &&
    (mode === 'catalog' || modelName.trim().length > 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('saving');

    const trimmedProvider = provider.trim();
    const trimmedBaseUrl = showBaseUrl ? baseUrl.trim() : undefined;
    const trimmedKey = apiKey.trim();
    const trimmedModel = modelName.trim();
    const targetModel = (mode === 'catalog' ? (catalogModelName ?? '').trim() : trimmedModel);

    if (mode === 'catalog' && !targetModel) {
      setPhase('idle');
      setError('Model is required');
      return;
    }

    let result;
    if (mode === 'catalog') {
      result = await configureCatalogProvider({
        provider: trimmedProvider,
        baseUrl: trimmedBaseUrl,
        apiKey: trimmedKey,
        modelName: targetModel,
      });
    } else {
      result = await addCustomModel({
        provider: trimmedProvider,
        modelName: trimmedModel,
        baseUrl: trimmedBaseUrl,
        apiKey: trimmedKey,
      });
    }

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
      if (mode === 'custom' && existingModel?.isCustom) {
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
    if (mode === 'catalog') return isEditing ? 'Save changes' : 'Add key';
    return isEditing ? 'Save changes' : 'Add model';
  })();

  const heading = (() => {
    if (mode === 'catalog') {
      const target = (catalogModelName ?? catalogProvider!.name).trim();
      return `${target} API key`;
    }
    if (isEditing) return 'Edit model';
    return 'Add model';
  })();

  const description = (() => {
    if (mode === 'catalog') {
      const target = (catalogModelName ?? catalogProvider!.name).trim();
      return `Save the API key for ${catalogProvider!.name} to enable ${target} in chat.`;
    }
    if (isEditing) return 'Update or remove this model.';
    return 'Add a custom model not in the default catalog.';
  })();

  const keyLabel = mode === 'catalog' && catalogProvider
    ? catalogProvider.keyLabel || 'API Key'
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

          {mode === 'custom' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="me-model" className="text-sidebar-foreground">
                Model<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="me-model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                className="bg-input/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 font-mono"
              />
            </div>
          )}

          {showBaseUrl && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="me-baseurl" className="text-sidebar-foreground">
                Base URL
              </Label>
              <Input
                id="me-baseurl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={mode === 'catalog' && catalogProvider && catalogProvider.baseUrl ? catalogProvider.baseUrl : 'https://api.example.com/v1'}
                disabled={false}
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

          {mode === 'catalog' && catalogProvider?.docsUrl && (
            <p className="text-xs text-sidebar-foreground/60">
              Get a key from{' '}
              <a
                href={catalogProvider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sidebar-foreground underline underline-offset-2 hover:text-primary"
              >
                {safeHostname(catalogProvider.docsUrl)}
              </a>
              .
            </p>
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

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
