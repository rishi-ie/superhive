import { settings } from '@/api/settings';

export interface EnabledModel {
  id: string;
  provider: string;
  name: string;
  contextWindow?: number;
}

/**
 * The IPC returns `{ id, name, contextWindow }` without `provider`. We
 * derive `provider` from the `id` (which is `${provider}:${name}` per the
 * settings schema) so the caller's `EnabledModel` shape is satisfied.
 */
export async function getEnabledModels(): Promise<EnabledModel[]> {
  const rows = await settings.getEnabledModels();
  return rows.map((row) => ({
    ...row,
    provider: row.id.includes(':') ? row.id.split(':').slice(0, -1).join(':') : row.id,
  }));
}
