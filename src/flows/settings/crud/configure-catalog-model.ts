import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface ConfigureCatalogModelInput {
  provider: string;
  modelName: string;
  baseUrl?: string;
  apiKey: string;
}

export interface ConfigureCatalogModelResult {
  ok: boolean;
  error?: string;
}

/**
 * Save a key + optional base URL for a known catalog model.
 * The model itself is enabled on success so it shows in the chat picker.
 */
export async function configureCatalogModel(
  input: ConfigureCatalogModelInput,
): Promise<ConfigureCatalogModelResult> {
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
    await settings.setModelEnabled(`${provider}:${modelName}`, true);
    toast.success(`Saved key for ${modelName}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save key';
    toast.error(message);
    return { ok: false, error: message };
  }
}
