import { useCallback, useRef } from 'react'
import { updateAgentSettings } from '@/flows/agents/settings/update-agent-settings'

export interface AutoSaveHandle {
  patch: (key: string, value: unknown) => void
  flush: (p: Record<string, unknown>) => Promise<void>
}

export function useAutoSave(agentId: string, _onFlush?: () => void): AutoSaveHandle {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRef = useRef<Record<string, unknown> | null>(null)

  const patch = useCallback((key: string, value: unknown) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!pendingRef.current) pendingRef.current = {}
    pendingRef.current[key] = value
    timerRef.current = setTimeout(async () => {
      const p = pendingRef.current
      pendingRef.current = null
      timerRef.current = null
      if (!p || Object.keys(p).length === 0) return
      await updateAgentSettings({ agentId, patch: p })
    }, 300)
  }, [agentId])

  const flush = useCallback(async (p: Record<string, unknown>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pendingRef.current = null
    if (Object.keys(p).length === 0) return
    await updateAgentSettings({ agentId, patch: p })
  }, [agentId])

  return { patch, flush }
}
