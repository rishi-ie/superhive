import * as React from 'react'
import { settings } from '@/api/settings'

/**
 * Subscribe to `settings:model-updated` IPC events. The main process emits
 * this when it auto-fills a ModelEntry's contextWindow from Pi telemetry.
 *
 * The hook returns nothing — it's a side-effect-only subscription. Callers
 * typically use it to invalidate a models cache so the chip re-renders.
 *
 * Replaces the direct `window.api.settings.onModelUpdated(...)` call that
 * used to live in `ModelsSection.tsx`.
 */
export function useModelUpdatedSubscription(onUpdate: () => void): void {
  React.useEffect(() => {
    if (!settings.onModelUpdated) return
    const unsub = settings.onModelUpdated(() => {
      onUpdate()
    })
    return unsub
  }, [onUpdate])
}
