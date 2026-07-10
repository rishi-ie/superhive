import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface DeleteModelResult {
  ok: boolean;
  error?: string;
}

export async function deleteModel(id: string): Promise<DeleteModelResult> {
  if (!id?.trim()) {
    return { ok: false, error: 'Model id is required' };
  }
  try {
    await settings.deleteModel(id);
    toast.success('Model deleted');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete model';
    toast.error(message);
    return { ok: false, error: message };
  }
}