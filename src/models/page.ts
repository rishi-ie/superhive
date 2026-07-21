/**
 * Page-local shapes — public surface of `src/pages/`.
 *
 * Per modularity-check.md Step 1, types live in exactly one of three
 * homes. These are renderer domain shapes so they live in `src/models/`.
 * Storage shapes stay in `src/storage/types.ts`; IPC shapes stay in
 * `src/types/electron.d.ts`.
 */

import type { ReactNode } from 'react'
import type { ContentPart } from './runtime'
import type { ProviderEntry } from '@/types/electron'

// ---------------------------------------------------------------------------
// Settings: API Keys block
// ---------------------------------------------------------------------------

export type ProviderKeyBlockShape = 'single' | 'aws'

export interface ProviderKeyBlockProps {
  providerName: string
  heading: string
  docsUrl?: string
  /** `single`: API Key + Base URL + Model.
   *  `aws`: Access Key ID + Secret Access Key + Region + Model. */
  shape: ProviderKeyBlockShape
  /** Should this block show the optional Base URL field? */
  showBaseUrl?: boolean
  baseUrlPlaceholder?: string
  existingProvider?: ProviderEntry
  onSaved?: () => void
}

// ---------------------------------------------------------------------------
// Settings: provider catalog
// ---------------------------------------------------------------------------

export interface CatalogModel {
  id: string
  provider: string
  name: string
}

export interface CatalogProviderMeta {
  /** Stable provider name used as the key in `db.settings.json` and the
   *  provider entrypoint throughout the app. */
  name: string
  /** Default base URL override; not all providers expose one. */
  baseUrl: string
  showBaseUrl: boolean
  keyLabel: string
  /** External page where the user can obtain an API key. */
  docsUrl: string
  /** Whether this provider has a block in the API Keys section. */
  hasApiKeysBlock: boolean
  /** For AWS Bedrock: multi-field auth. */
  authKind: 'single' | 'aws'
}

// ---------------------------------------------------------------------------
// Settings: section registry
// ---------------------------------------------------------------------------

export interface SettingsSection {
  id: string
  label: string
  icon: (props: { className?: string }) => ReactNode
  trailingIcon?: (props: { className?: string }) => ReactNode
}

export interface SettingsSectionGroup {
  title?: string
  sections: SettingsSection[]
}

// ---------------------------------------------------------------------------
// Agent chat: tool-call card primitives
// ---------------------------------------------------------------------------

export interface ToolCallCardBaseProps {
  part: Extract<ContentPart, { type: 'tool-call' }>
  result?: Extract<ContentPart, { type: 'tool-result' }>
  /** When true, the card treats itself as actively running — shows the elapsed timer
   *  and keeps itself expanded. Derived from: part.state !== 'complete' || result?.state !== 'complete'. */
  running?: boolean
}

/** Header is rendered by each tool-specific subclass. Body content goes
 *  through `<CollapsibleContent>`. The base owns the chrome — token-driven
 *  background, status dot, duration timer, collapse-by-default behavior. */
export interface ToolCallCardSlots {
  header: React.ReactNode
  body: React.ReactNode
}
