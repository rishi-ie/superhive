import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface SetProviderInput {
  name: string;
  baseUrl?: string;
  apiKey?: string;
}

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
    });
    toast.success(`Provider "${name}" saved`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save provider';
    toast.error(message);
    return { ok: false, error: message };
  }
}