import { settings } from '@/api/settings';

export interface EnabledModel {
  id: string;
  provider: string;
  name: string;
}

export async function getEnabledModels(): Promise<EnabledModel[]> {
  return settings.getEnabledModels();
}