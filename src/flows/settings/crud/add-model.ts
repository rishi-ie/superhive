import { toast } from 'sonner';
import { settings } from '@/api/settings';
import type { AddModelInput, AddModelResult } from '@/models/settings';

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
    // contextWindow is intentionally not passed — it is auto-resolved
    // from Pi's model registry (or the HARDCODED_CONTEXT_WINDOWS fallback)
    // via the superhive-pi-telemetry extension on the next model_select,
    // and written back to this row by the main process.
    await settings.addModel({
      provider,
      name,
    });
    toast.success(`Model "${name}" added`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add model';
    toast.error(message);
    return { ok: false, error: message };
  }
}
