/**
 * useManageTabPatch — shared routing-patch hook for the right-sidebar
 * Manage tab (both AgentSettingsPanel and ProjectSettingsPanel).
 *
 * Writes user-tweakable fields to the right truth file:
 *   - `manage.json` (skills, extensions, planMode, etc.)
 *   - `settings.json` (defaultThinkingLevel + runtime.thinkingLevel)
 *
 * The Thinking Level patch is a DUAL-WRITE:
 *   - `settings.json.defaultThinkingLevel` (Tier 2, persistent) — applies on
 *     next session start
 *   - `settings.json.runtime.thinkingLevel` (Tier 1, live) — fires
 *     `pi.setThinkingLevel()` within ~30ms via the truth ext's
 *     `applySettingsDiff`, so the next LLM message uses the new level
 *     without a /reload.
 *
 * The nested `runtime.thinkingLevel` patch is sent as a full object (not a
 * dotted key) so the WRITE_SETTINGS deep merge preserves siblings like
 * `activeTools`, `currentSessionId`, `lastReloadedAt`. See
 * `superhive/docs/AGENT_SETTINGS.md §17` for the full pattern.
 *
 * Add new settings.json fields here as the Manage tab grows.
 */

import * as React from 'react'

interface ManageSlice {
  patch: (key: string, value: unknown) => void
}

interface SettingsSlice {
  patch: (key: string, value: unknown) => void
  settings: {
    runtime?: {
      thinkingLevel?: string
      activeTools?: string[]
      currentSessionId?: string
      lastReloadedAt?: string
    }
  } | null
}

export function useManageTabPatch(manage: ManageSlice, settingsJson: SettingsSlice) {
  return React.useCallback(
    (key: string, value: unknown) => {
      if (key === 'defaultThinkingLevel') {
        // Tier 2 (persistent): top-level field — lands correctly via the
        // deep WRITE_SETTINGS merge.
        settingsJson.patch('defaultThinkingLevel', value)
        // Tier 1 (live): nested under runtime. Build the full nested object
        // so the deep merge preserves siblings.
        const currentRuntime = settingsJson.settings?.runtime ?? {}
        settingsJson.patch('runtime', { ...currentRuntime, thinkingLevel: value })
      } else {
        manage.patch(key, value)
      }
    },
    [manage, settingsJson],
  )
}