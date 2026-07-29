import * as React from 'react'
import type { ProjectChannelMessage } from '@/orchestration/domain/entities'

export function useProjectConversation(projectId: string | null) {
  const [messages, setMessages] = React.useState<ProjectChannelMessage[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    if (!projectId) {
      setMessages([])
      return
    }
    try {
      setMessages(await window.api.orchestration.listProjectMessages(projectId))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [projectId])

  React.useEffect(() => {
    void reload()
    if (!projectId) return
    return window.api.orchestration.onProjectChatChanged(projectId, () => void reload())
  }, [projectId, reload])

  return { messages, error, reload }
}

