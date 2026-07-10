import type { ProviderEntry, ModelEntry } from '@/types/electron'

export const settings = {
  getProviders: (): Promise<Record<string, ProviderEntry>> =>
    window.api.settings.getProviders(),

  setProvider: (input: { name: string; baseUrl?: string; apiKey?: string }): Promise<void> =>
    window.api.settings.setProvider(input),

  deleteProvider: (name: string): Promise<void> =>
    window.api.settings.deleteProvider(name),

  getModels: (): Promise<ModelEntry[]> =>
    window.api.settings.getModels(),

  setModelEnabled: (id: string, enabled: boolean): Promise<void> =>
    window.api.settings.setModelEnabled(id, enabled),

  addModel: (input: { provider: string; name: string }): Promise<void> =>
    window.api.settings.addModel(input),

  deleteModel: (id: string): Promise<void> =>
    window.api.settings.deleteModel(id),

  getEnabledModels: (): Promise<Array<{ id: string; provider: string; name: string }>> =>
    window.api.settings.getEnabledModels(),
}