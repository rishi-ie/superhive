import { useEffect, useState } from 'react'
import { Plus, Pencil, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AgentData } from '@/types/electron'

interface AgentListProps {
  projectId?: string
  onSelect: (agent: AgentData) => void
  onEdit: (agent: AgentData) => void
  selectedId?: string
}

export function AgentList({ projectId, onSelect, onEdit, selectedId }: AgentListProps) {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)

  const loadAgents = async () => {
    setLoading(true)
    try {
      const data = projectId
        ? await window.electronAPI.agent.listByProject(projectId)
        : await window.electronAPI.agent.list()
      setAgents(data)
    } catch (err) {
      console.error('Failed to load agents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [projectId])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Bot className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No agents yet</p>
        <Button size="sm" onClick={() => onSelect({} as AgentData)}>
          <Plus className="mr-2 size-4" />
          New Agent
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {agents.map((agent) => (
        <div
          key={agent.id}
          onClick={() => onSelect(agent)}
          className={`group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
            selectedId === agent.id ? 'bg-accent' : ''
          }`}
        >
          <span className="text-base">{agent.avatar || '🤖'}</span>
          <span className="flex-1 truncate">
            {agent.name}
            {agent.role && <span className="ml-2 text-xs text-muted-foreground">{agent.role}</span>}
          </span>
          <span
            className={`size-2 rounded-full ${
              agent.status === 'running'
                ? 'bg-green-500'
                : agent.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-muted-foreground'
            }`}
          />
          <Button
            size="sm"
            variant="ghost"
            className="size-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(agent)
            }}
          >
            <Pencil className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
