import { toast } from 'sonner';
import { settings } from '@/api/settings';
import type { UpdateModelInput, UpdateModelResult } from '@/models/settings';

export async function updateModel(input: UpdateModelInput): Promise<UpdateModelResult> {
  const provider = input.provider.trim();
  const name = input.name.trim();
  const apiKey = input.apiKey.trim();
  if (!provider || !name || !apiKey) {
    const error = 'Provider, model, and API key are required';
    toast.error(error);
    return { ok: false, error };
  }

  try {
    await settings.updateModel({ ...input, provider, name, apiKey });
    toast.success(`Saved ${provider}:${name}`);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to save model';
    toast.error(error);
    return { ok: false, error };
  }
}
