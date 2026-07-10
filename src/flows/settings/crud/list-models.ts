import { settings } from '@/api/settings';
import type { ModelEntry } from '@/types/electron';

export async function listModels(): Promise<ModelEntry[]> {
  return settings.getModels();
}