import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CheckCircleIcon, CircleNotchIcon, FloppyDiskIcon, XCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/common/PasswordInput';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { saveProviderBlock } from '@/flows/settings/crud/save-provider-block';
import { notifyProviderBlockSaved, notifyProviderBlockCleared } from '@/flows/settings/crud/notify-provider-block';
import type { ProviderEntry } from '@/types/electron';
import type { ProviderKeyBlockProps, ProviderKeyBlockShape } from '@/models/page';

export type { ProviderKeyBlockProps, ProviderKeyBlockShape };

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
      notifyProviderBlockSaved(heading)
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
      notifyProviderBlockCleared(heading)
      setState(initialState(undefined))
      onSaved?.()
    } catch (err) {
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Failed to clear')
    }
  }

  const submitting = phase !== 'idle'

  return (
    <form onSubmit={onSave}>
      <Card size="sm" className="rounded-card">
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          {docsUrl ? (
            <CardDescription>
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
            </CardDescription>
          ) : null}
          <CardAction>
            <Switch
              checked={state.enabled}
              disabled={submitting || (!hasExisting && !state.preferredModel.trim() && !state.apiKey.trim() && shape === 'single') || (!hasExisting && !state.accessKeyId.trim() && !state.secretAccessKey && shape === 'aws')}
              onCheckedChange={(v) => setState((p) => ({ ...p, enabled: v }))}
              aria-label={`Show ${heading} in chat`}
            />
          </CardAction>
        </CardHeader>

        <CardContent>
          <FieldGroup>
          {shape === 'single' ? (
            <>
              <Field>
                <FieldLabel>API Key</FieldLabel>
            <PasswordInput
              value={state.apiKey}
              onChange={(e) => setState((p) => ({ ...p, apiKey: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'Enter your API key'}
            />
              </Field>
          {showBaseUrl && (
                <Field>
                  <FieldLabel>Endpoint (Base URL)</FieldLabel>
              <Input
                value={state.baseUrl}
                onChange={(e) => setState((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder={baseUrlPlaceholder}
                className="font-mono"
              />
                </Field>
          )}
              <Field>
                <FieldLabel>Model</FieldLabel>
            <Input
              value={state.preferredModel}
              onChange={(e) => setState((p) => ({ ...p, preferredModel: e.target.value }))}
              placeholder="e.g. gpt-4o"
              className="font-mono"
            />
                <FieldDescription>
              Default model for this provider. Saved with the master toggle above.
                </FieldDescription>
              </Field>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel>Access Key ID</FieldLabel>
            <Input
              value={state.accessKeyId}
              onChange={(e) => setState((p) => ({ ...p, accessKeyId: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'AKIA…'}
              className="font-mono"
            />
              </Field>
              <Field>
                <FieldLabel>Secret Access Key</FieldLabel>
            <PasswordInput
              value={state.secretAccessKey}
              onChange={(e) => setState((p) => ({ ...p, secretAccessKey: e.target.value }))}
              placeholder={hasExisting ? '•••••••• (stored)' : 'Enter Secret Access Key'}
            />
              </Field>
              <Field>
                <FieldLabel>Region</FieldLabel>
            <Input
              value={state.region}
              onChange={(e) => setState((p) => ({ ...p, region: e.target.value }))}
              placeholder="us-east-1"
              className="font-mono"
            />
              </Field>
              <Field>
                <FieldLabel>Model</FieldLabel>
            <Input
              value={state.preferredModel}
              onChange={(e) => setState((p) => ({ ...p, preferredModel: e.target.value }))}
              placeholder="anthropic.claude-3-5-sonnet-20241022-v2:0"
              className="font-mono"
            />
                <FieldDescription>
              Default Bedrock model id. Saved with the master toggle above.
                </FieldDescription>
              </Field>
            </>
          )}

          {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-end gap-stack border-t">
        {hasExisting && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={submitting}
          >
            <Icon icon={XCircleIcon} data-icon="inline-start" />
            Clear
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Icon icon={CircleNotchIcon} data-icon="inline-start" className="animate-spin" />
          ) : (
            <Icon icon={hasExisting ? FloppyDiskIcon : CheckCircleIcon} data-icon="inline-start" />
          )}
          {hasExisting ? 'Save' : 'Add'}
        </Button>
        </CardFooter>
      </Card>
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
