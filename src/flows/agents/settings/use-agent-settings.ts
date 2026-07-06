import { useCallback, useEffect, useState } from 'react'
import { agents } from '@/api/agents'
import type { AgentSettingsState } from './index'

export function useAgentSettings(agentId: string | null) {
  const [settings, setSettings] = useState<AgentSettingsState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!agentId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await agents.readSettings(agentId)
      setSettings(result as AgentSettingsState | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    if (!agentId) return
    const unsub = agents.onSettingsChanged(agentId, () => { void reload() })
    return unsub
  }, [agentId, reload])

  return { settings, isLoading, error, reload }
}
