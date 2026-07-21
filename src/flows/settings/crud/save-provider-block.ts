import { settings } from '@/api/settings';
import type { SaveProviderBlockInput, SaveProviderBlockResult } from '@/models/settings';

/**
 * Persist a single API Keys block. The IPC handles master-toggle cleanup
 * (clears preferredModel when apiKey transitions to empty, deletes the
 * preferred-model row, etc.). No toasts — the caller decides UX.
 */
export async function saveProviderBlock(
  input: SaveProviderBlockInput,
): Promise<SaveProviderBlockResult> {
  const provider = input.provider?.trim();
  if (!provider) {
    return { ok: false, error: 'Provider is required' };
  }
  try {
    await settings.setProvider({
      name: provider,
      baseUrl: input.baseUrl?.trim() || undefined,
      apiKey: input.apiKey?.trim() || undefined,
      enabled: input.enabled,
      preferredModel: input.preferredModel?.trim() || undefined,
      accessKeyId: input.accessKeyId?.trim() || undefined,
      secretAccessKey: input.secretAccessKey ?? undefined,
      region: input.region?.trim() || undefined,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save block';
    return { ok: false, error: message };
  }
}
