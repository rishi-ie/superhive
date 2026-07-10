import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface DeleteProviderResult {
  ok: boolean;
  error?: string;
}

export async function deleteProvider(name: string): Promise<DeleteProviderResult> {
  if (!name?.trim()) {
    return { ok: false, error: 'Provider name is required' };
  }
  try {
    await settings.deleteProvider(name);
    toast.success(`Provider "${name}" deleted`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete provider';
    toast.error(message);
    return { ok: false, error: message };
  }
}