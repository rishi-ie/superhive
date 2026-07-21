import { settings } from '@/api/settings';
import type { SetModelEnabledResult } from '@/models/settings';

export async function setModelEnabled(
  id: string,
  enabled: boolean,
): Promise<SetModelEnabledResult> {
  try {
    await settings.setModelEnabled(id, enabled);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update model';
    return { ok: false, error: message };
  }
}