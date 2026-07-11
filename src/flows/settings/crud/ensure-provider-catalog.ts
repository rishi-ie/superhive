import { settings } from '@/api/settings';

export interface EnsureProviderCatalogInput {
  provider: string;
  apiKeyIsFresh?: boolean;
}

export interface EnsureProviderCatalogResult {
  ok: boolean;
  inserted?: number;
  error?: string;
}

export async function ensureProviderCatalog(
  input: EnsureProviderCatalogInput,
): Promise<EnsureProviderCatalogResult> {
  const provider = input.provider?.trim();
  if (!provider) {
    return { ok: false, error: 'Provider is required' };
  }
  try {
    const { inserted } = await settings.ensureProviderCatalog({
      provider,
      apiKeyIsFresh: input.apiKeyIsFresh,
    });
    return { ok: true, inserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to ensure provider catalog';
    return { ok: false, error: message };
  }
}
