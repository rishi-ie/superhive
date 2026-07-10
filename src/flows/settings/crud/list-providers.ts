import { settings } from '@/api/settings';
import type { ProviderEntry } from '@/types/electron';

export async function listProviders(): Promise<Record<string, ProviderEntry>> {
  return settings.getProviders();
}