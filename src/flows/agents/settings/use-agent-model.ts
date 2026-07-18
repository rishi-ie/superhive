import * as React from 'react'
import { useAgentSettings } from './use-agent-settings'
import { useAgentRuntime } from '../runtime/use-agent-runtime'

/**
 * The single source of truth for an agent's selected model.
 *
 * Reads the persisted model from the per-agent settings file
 * (`<agentDir>/Superhive-pi-<basename>.json`, owned by `superhive-pi-truth`),
 * watches what the Pi runtime actually picked, and writes the runtime's
 * choice back to the file when they disagree.
 *
 * `useAgentSettings.patch` already keeps `defaultProvider` / `defaultModel`
 * / `enabledModels` in lockstep, so a single `patch('model', ...)` here is
 * enough to keep the whole settings tuple honest.
 *
 * Returns the persisted model (always equal to the runtime's active model
 * once the sync effect has run) plus a `setModel` helper that callers can
 * use to change the selection.
 *
 * Accepts `undefined` for decorative contexts (e.g. the landing page where
 * no agent is bound) — no settings slice is created and `setModel` is a
 * no-op.
 */
export function useAgentModel(agentId: string | undefined) {
  const { settings, patch } = useAgentSettings(agentId ?? null)
  const { activeModelProvider, activeModelName } = useAgentRuntime(agentId)

  React.useEffect(() => {
    if (!agentId) return
    if (!activeModelProvider || !activeModelName) return
    const persisted = settings?.model
    if (
      persisted?.provider === activeModelProvider &&
      persisted?.name === activeModelName
    ) {
      return
    }
    patch('model', { provider: activeModelProvider, name: activeModelName })
  }, [agentId, activeModelProvider, activeModelName, settings?.model, patch])

  const setModel = React.useCallback(
    (model: { provider: string; name: string }) => {
      if (!agentId) return
      patch('model', model)
    },
    [agentId, patch],
  )

  return { model: settings?.model ?? null, setModel }
}
