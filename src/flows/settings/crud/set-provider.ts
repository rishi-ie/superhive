import { toast } from 'sonner';
import { settings } from '@/api/settings';
import type { SetProviderInput } from '@/types/electron';

export type {
  SetProviderInput,
  ProviderEntry,
} from '@/types/electron';

export interface SetProviderResult {
  ok: boolean;
  error?: string;
}

export async function setProvider(input: SetProviderInput): Promise<SetProviderResult> {
  const name = input.name?.trim();
  if (!name) {
    toast.error('Provider name is required');
    return { ok: false, error: 'Provider name is required' };
  }
  try {
    await settings.setProvider({
      name,
      baseUrl: input.baseUrl?.trim() || undefined,
      apiKey: input.apiKey?.trim() || undefined,
      enabled: input.enabled,
      preferredModel: input.preferredModel?.trim() || undefined,
      accessKeyId: input.accessKeyId?.trim() || undefined,
      secretAccessKey: input.secretAccessKey ?? undefined,
      region: input.region?.trim() || undefined,
    });
    toast.success(`Provider "${name}" saved`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save provider';
    toast.error(message);
    return { ok: false, error: message };
  }
}
