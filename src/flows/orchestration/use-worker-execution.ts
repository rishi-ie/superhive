import * as React from 'react'
import type { WorkerExecutionSnapshot } from '@/orchestration/domain/entities'

export function useWorkerExecution(agentId: string | null) {
  const [snapshot, setSnapshot] = React.useState<WorkerExecutionSnapshot | null>(null)
  const [loading, setLoading] = React.useState(Boolean(agentId))
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    if (!agentId) {
      setSnapshot(null)
      setLoading(false)
      return
    }
    try {
      setSnapshot(await window.api.orchestration.getAgentSnapshot(agentId))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [agentId])

  React.useEffect(() => {
    setLoading(Boolean(agentId))
    void reload()
    if (!agentId) return
    return window.api.orchestration.onAgentChanged(agentId, (next) => {
      setSnapshot(next)
      setLoading(false)
      setError(null)
    })
  }, [agentId, reload])

  return { snapshot, loading, error, reload }
}

