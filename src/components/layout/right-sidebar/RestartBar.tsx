import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { restartAgent } from '@/flows/agents/runtime/restart-agent'
import type { AgentStatus } from '@/storage/types'

interface RestartBarProps {
  agentId: string
  status: AgentStatus
}

export function RestartBar({ agentId, status }: RestartBarProps) {
  const disabled = status === 'initializing'

  return (
    <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
      <span className="text-xs text-muted-foreground">Live runtime</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={() => void restartAgent(agentId)}
        disabled={disabled}
      >
        <RotateCw className="size-3.5" />
        Restart
      </Button>
    </div>
  )
}
