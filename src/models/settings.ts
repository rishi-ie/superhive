/**
 * Settings domain shapes — public surface of `src/flows/settings/`.
 */

import type { ModelEntry, ProviderEntry } from '@/types/electron'

// ---------------------------------------------------------------------------
// CRUD inputs and results
// ---------------------------------------------------------------------------

export interface AddModelInput {
  provider: string
  name: string
}

export interface AddModelResult {
  ok: boolean
  error?: string
}

export interface AddCustomModelInput {
  provider: string
  modelName: string
  baseUrl?: string
  apiKey: string
}

export interface AddCustomModelResult {
  ok: boolean
  error?: string
}

export interface ConfigureCatalogProviderInput {
  provider: string
  baseUrl?: string
  apiKey: string
  modelName: string
}

export interface ConfigureCatalogProviderResult {
  ok: boolean
  error?: string
}

export interface DeleteProviderResult {
  ok: boolean
  error?: string
}

export interface DeleteModelResult {
  ok: boolean
  error?: string
}

export interface SetModelEnabledResult {
  ok: boolean
  error?: string
}

export interface SaveProviderBlockInput {
  provider: string
  baseUrl?: string
  apiKey?: string
  enabled?: boolean
  preferredModel?: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
}

export interface SaveProviderBlockResult {
  ok: boolean
  error?: string
}

export interface EnabledModel {
  id: string
  provider: string
  name: string
  contextWindow?: number
}

// ---------------------------------------------------------------------------
// Hook results
// ---------------------------------------------------------------------------

export interface UseModelsResult {
  models: ModelEntry[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface UseProvidersResult {
  providers: Record<string, ProviderEntry>
  providerNames: Set<string>
  providersWithKey: Set<string>
  hasProvider: (name: string) => boolean
  hasApiKey: (name: string) => boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}
