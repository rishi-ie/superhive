/**
 * Cross-domain UI shapes — public surface of `src/flows/ui/`.
 *
 * These are not entity types. They describe UX primitives shared across
 * pages (composer, command palette, breadcrumbs, app-update banner).
 */

import type { ChatRow } from '@/models/assistant-message'

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

export interface SendMessageInput {
  text: string
  isLive: boolean
  send: (text: string) => void
}

export interface SendMessageResult {
  ok: boolean
}

// ---------------------------------------------------------------------------
// Center breadcrumb
// ---------------------------------------------------------------------------

export interface BreadcrumbSegment {
  label: string
  href?: string
  clickable?: boolean
}

// ---------------------------------------------------------------------------
// Command palette
// ---------------------------------------------------------------------------

export interface CommandPaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

// ---------------------------------------------------------------------------
// App update banner
// ---------------------------------------------------------------------------

export interface UpdateInfo {
  version: string
  releaseName?: string
}

// ---------------------------------------------------------------------------
// Shortcut: copy last assistant message
// ---------------------------------------------------------------------------

export interface ShortcutCopyLastAssistantInput {
  messages: ChatRow[]
}

export interface ShortcutCopyLastAssistantResult {
  ok: boolean
  text?: string
}
