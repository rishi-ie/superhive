import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface AddModelInput {
  provider: string;
  name: string;
  contextWindow?: number;
}

export interface AddModelResult {
  ok: boolean;
  error?: string;
}

export async function addModel(input: AddModelInput): Promise<AddModelResult> {
  const provider = input.provider?.trim();
  const name = input.name?.trim();
  if (!provider) {
    toast.error('Provider is required');
    return { ok: false, error: 'Provider is required' };
  }
  if (!name) {
    toast.error('Model name is required');
    return { ok: false, error: 'Model name is required' };
  }
  try {
    await settings.addModel({
      provider,
      name,
      contextWindow: input.contextWindow,
    });
    toast.success(`Model "${name}" added`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add model';
    toast.error(message);
    return { ok: false, error: message };
  }
}
