import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CheckCircleIcon, CircleNotchIcon, FloppyDiskIcon, XCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/common/PasswordInput';
import { saveProviderBlock } from '@/flows/settings/crud/save-provider-block';
import { toast } from 'sonner';
import type { ProviderEntry } from '@/types/electron';

export type ProviderKeyBlockShape = 'single' | 'aws';

export interface ProviderKeyBlockProps {
  providerName: string;
  heading: string;
  docsUrl?: string;
  /** `single`: API Key + Base URL + Model.
   *  `aws`: Access Key ID + Secret Access Key + Region + Model. */
  shape: ProviderKeyBlockShape;
  /** Should this block show the optional Base URL field? */
  showBaseUrl?: boolean;
  baseUrlPlaceholder?: string;
  existingProvider?: ProviderEntry;
  onSaved?: () => void;
}

interface FormState {
  apiKey: string;
  baseUrl: string;
  preferredModel: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  enabled: boolean;
}

const EMPTY: FormState = {
  apiKey: '',
  baseUrl: '',
  preferredModel: '',
  accessKeyId: '',
  secretAccessKey: '',
  region: '',
  enabled: false,
};

function initialState(existing?: ProviderEntry): FormState {
  if (!existing) return EMPTY
  return {
    apiKey: '',
    baseUrl: existing.baseUrl ?? '',
    preferredModel: existing.preferredModel ?? '',
    accessKeyId: existing.accessKeyId ?? '',
    secretAccessKey: '',
    region: existing.region ?? '',
    enabled: existing.enabled === true,
  }
}

export function ProviderKeyBlock({
  providerName,
  heading,
  docsUrl,
  shape,
  showBaseUrl = false,
  baseUrlPlaceholder = 'https://api.example.com/v1',
  existingProvider,
  onSaved,
}: ProviderKeyBlockProps) {
  const [state, setState] = React.useState<FormState>(() => initialState(existingProvider))
  const [phase, setPhase] = React.useState<'idle' | 'saving'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setState(initialState(existingProvider))
  }, [existingProvider?.apiKey, existingProvider?.baseUrl, existingProvider?.preferredModel, existingProvider?.enabled, existingProvider?.accessKeyId, existingProvider?.region])

  const hasExisting = Boolean(
    shape === 'aws'
      ? existingProvider?.accessKeyId?.trim() || existingProvider?.secretAccessKey?.trim()
      : existingProvider?.apiKey?.trim(),
  )

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPhase('saving')

    const trimmedKey = state.apiKey.trim()
    const trimmedBaseUrl = showBaseUrl ? state.baseUrl.trim() : ''
    const trimmedPreferred = state.preferredModel.trim()
    const trimmedAccessKeyId = state.accessKeyId.trim()
    const trimmedSecretAccessKey = state.secretAccessKey
    const trimmedRegion = state.region.trim()

    if (shape === 'single') {
      // Validate: if user typed a preferred model but no key, error.
      if (trimmedPreferred && !trimmedKey && !existingProvider?.apiKey?.trim()) {
        setPhase('idle')
        setError('API key is required when a model is specified')
        return
      }
    } else if (shape === 'aws') {
      if (
        (trimmedAccessKeyId || trimmedSecretAccessKey || trimmedRegion || trimmedPreferred) &&
        !existingProvider?.accessKeyId?.trim() &&
        !existingProvider?.secretAccessKey?.trim() &&
        !trimmedAccessKeyId &&
        !trimmedSecretAccessKey
      ) {
        setPhase('idle')
        setError('AWS credentials are required to save')
        return
      }
    }

    try {
      const payload = {
        provider: providerName,
        baseUrl: trimmedBaseUrl || undefined,
        apiKey: trimmedKey || undefined,
        enabled: state.enabled,
        preferredModel: trimmedPreferred || undefined,
        accessKeyId: trimmedAccessKeyId || undefined,
        secretAccessKey: trimmedSecretAccessKey || undefined,
        region: trimmedRegion || undefined,
      }
      const result = await saveProviderBlock(payload)
      if (!result.ok) {
        setPhase('idle')
        setError(result.error ?? 'Failed to save')
        return
      }
      toast.success(`${heading} saved`)
      onSaved?.()
    } catch (err) {
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const onClear = async () => {
    setError(null)
    setPhase('saving')
    try {
      const payload = {
        provider: providerName,
        apiKey: undefined,
        baseUrl: showBaseUrl ? '' : undefined,
        enabled: false,
        preferredModel: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
        region: undefined,
      }
      const result = await saveProviderBlock(payload)
      if (!result.ok) {
        setPhase('idle')
        setError(result.error ?? 'Failed to clear')
        return
      }
      toast.success(`${heading} cleared`)
      setState(initialState(undefined))
      onSaved?.()
    } catch (err) {
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Failed to clear')
    }
  }

  const submitting = phase !== 'idle'

  return (
    <form onSubmit={onSave} className="flex flex-col gap-3 rounded-md border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
          {docsUrl && (
            <p className="text-xs text-muted-foreground">
              Get a key from{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                {safeHostname(docsUrl)}
              </a>
              .
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show in chat</span>
          <Switch
            checked={state.enabled}
            disabled={submitting || (!hasExisting && !state.preferredModel.trim() && !state.apiKey.trim() && shape === 'single') || (!hasExisting && !state.accessKeyId.trim() && !state.secretAccessKey && shape === 'aws')}
            onCheckedChange={(v) => setState((p) => ({ ...p, enabled: v }))}
            aria-label={`Toggle ${heading}`}
          />
        </div>
      </div>

      {shape === 'single' ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">API Key</label>
            <PasswordInput
              value={state.apiKey}
              onChange={(e) => setState((p) => ({ ...p, apiKey: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'Enter your API key'}
            />
          </div>
          {showBaseUrl && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Endpoint (Base URL)</label>
              <Input
                value={state.baseUrl}
                onChange={(e) => setState((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder={baseUrlPlaceholder}
                className="font-mono"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Model</label>
            <Input
              value={state.preferredModel}
              onChange={(e) => setState((p) => ({ ...p, preferredModel: e.target.value }))}
              placeholder="e.g. gpt-4o"
              className="font-mono"
            />
            <p className="text-[0.65rem] text-muted-foreground">
              Default model for this provider. Saved with the master toggle above.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Access Key ID</label>
            <Input
              value={state.accessKeyId}
              onChange={(e) => setState((p) => ({ ...p, accessKeyId: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'AKIA…'}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Secret Access Key</label>
            <PasswordInput
              value={state.secretAccessKey}
              onChange={(e) => setState((p) => ({ ...p, secretAccessKey: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'Enter Secret Access Key'}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Region</label>
            <Input
              value={state.region}
              onChange={(e) => setState((p) => ({ ...p, region: e.target.value }))}
              placeholder="us-east-1"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Model</label>
            <Input
              value={state.preferredModel}
              onChange={(e) => setState((p) => ({ ...p, preferredModel: e.target.value }))}
              placeholder="anthropic.claude-3-5-sonnet-20241022-v2:0"
              className="font-mono"
            />
            <p className="text-[0.65rem] text-muted-foreground">
              Default Bedrock model id. Saved with the master toggle above.
            </p>
          </div>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {hasExisting && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={submitting}
            className="text-destructive hover:text-destructive gap-1.5"
          >
            <Icon icon={XCircleIcon} className="size-3.5" />
            Clear
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="gap-1.5">
          {submitting ? (
            <Icon icon={CircleNotchIcon} className="size-3.5 animate-spin" />
          ) : (
            <Icon icon={hasExisting ? FloppyDiskIcon : CheckCircleIcon} className="size-3.5" />
          )}
          {hasExisting ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
