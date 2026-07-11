import { toast } from 'sonner';
import { settings } from '@/api/settings';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';

export interface ConfigureCatalogProviderInput {
  provider: string;
  baseUrl?: string;
  apiKey: string;
  modelName: string;
}

export interface ConfigureCatalogProviderResult {
  ok: boolean;
  error?: string;
}

/**
 * Save a key for one of the 5 curated catalog providers, plus flip that
 * specific curated model row to enabled. No preferred-model concept here —
 * the API Keys section handles that separately.
 */
export async function configureCatalogProvider(
  input: ConfigureCatalogProviderInput,
): Promise<ConfigureCatalogProviderResult> {
  const provider = input.provider?.trim();
  const modelName = input.modelName?.trim();
  const apiKey = input.apiKey?.trim();

  if (!provider) {
    toast.error('Provider is required');
    return { ok: false, error: 'Provider is required' };
  }
  if (!modelName) {
    toast.error('Model is required');
    return { ok: false, error: 'Model is required' };
  }
  if (!apiKey) {
    toast.error('API key is required');
    return { ok: false, error: 'API key is required' };
  }

  try {
    await settings.setProvider({
      name: provider,
      baseUrl: input.baseUrl?.trim() || undefined,
      apiKey,
    });
    await setModelEnabled(`${provider}:${modelName}`, true);
    toast.success(`Saved key for ${provider}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save key';
    toast.error(message);
    return { ok: false, error: message };
  }
}
