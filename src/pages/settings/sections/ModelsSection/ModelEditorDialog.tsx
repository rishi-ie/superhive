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
import { PasswordInput } from '@/components/common/PasswordInput';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { addCustomModel } from '@/flows/settings/crud/add-custom-model';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { updateModel } from '@/flows/settings/crud/update-model';
import type { CatalogProviderMeta } from './catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';

interface ModelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  catalogProvider?: CatalogProviderMeta;
  catalogModelName?: string;
  catalogId?: string;
  existingModel?: ModelEntry;
  existingProvider?: ProviderEntry;
}

export function ModelEditorDialog({
  open,
  onOpenChange,
  onSaved,
  catalogProvider,
  catalogModelName,
  catalogId,
  existingModel,
  existingProvider,
}: ModelEditorDialogProps) {
  const isCatalog = Boolean(catalogId);
  const initialProvider = existingModel?.provider ?? catalogProvider?.name ?? '';
  const initialModelName = existingModel?.name ?? catalogModelName ?? '';
  const initialBaseUrl = existingProvider?.baseUrl ?? catalogProvider?.baseUrl ?? 'https://';
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

  const isEditing = Boolean(existingModel);
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

    const values = {
      provider: provider.trim(),
      name: modelName.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
    };
    const result = isEditing || isCatalog
      ? await updateModel({ id: existingModel?.id ?? catalogId!, catalogId, ...values })
      : await addCustomModel({ modelName: values.name, ...values });

    if (result.ok) {
      onSaved?.();
      onOpenChange(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to save');
    }
  };

  const onRemove = async () => {
    if (!existingModel) return;
    setPhase('removing');
    setError(null);
    const result = await deleteModel(existingModel.id);
    if (result.ok) {
      onSaved?.();
      onOpenChange(false);
    } else {
      setPhase('idle');
      setError(result.error ?? 'Failed to remove');
    }
  };

  const submitting = phase !== 'idle';
  const heading = isEditing ? 'Edit model' : isCatalog ? 'Configure model' : 'Add model';
  const description = isCatalog || isEditing
    ? 'Provider access is shared by models using the same provider.'
    : 'Add a custom model not in the default catalog.';
  const submitLabel = phase === 'saving'
    ? isEditing ? 'Saving…' : 'Adding…'
    : isCatalog && !isEditing ? 'Enable model' : isEditing ? 'Save changes' : 'Add model';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="me-provider">Provider<span className="ml-0.5 text-destructive">*</span></FieldLabel>
              <Input
                id="me-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                autoFocus={!isEditing}
                required
                className="font-mono"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="me-model">Model<span className="ml-0.5 text-destructive">*</span></FieldLabel>
              <Input
                id="me-model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                className="font-mono"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="me-baseurl">Base URL</FieldLabel>
              <Input
                id="me-baseurl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={catalogProvider?.baseUrl || 'https://api.example.com/v1'}
                className="font-mono"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="me-key">API Key<span className="ml-0.5 text-destructive">*</span></FieldLabel>
              <PasswordInput
                id="me-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                required
                className="font-mono"
              />
              <FieldDescription>Shared by all models using this provider.</FieldDescription>
            </Field>

            {isCatalog && catalogProvider?.docsUrl ? (
              <p className="text-xs text-muted-foreground">
                Get a key from{' '}
                <a
                  href={catalogProvider.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  {safeHostname(catalogProvider.docsUrl)}
                </a>
                .
              </p>
            ) : null}

            {error ? <FieldError>{error}</FieldError> : null}

            <DialogFooter className="gap-stack">
              {existingModel ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemove}
                  disabled={submitting}
                  className="mr-auto text-destructive"
                >
                  <Icon icon={TrashIcon} data-icon="inline-start" />
                  Remove
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? <Icon icon={CircleNotchIcon} data-icon="inline-start" className="animate-spin" /> : null}
                {submitLabel}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
