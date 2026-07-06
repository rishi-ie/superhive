import { useParams } from 'react-router-dom'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Bot } from 'lucide-react'
import { AgentSettingsPanel } from './AgentSettingsPanel'

interface RightSidebarProps {
  width?: number
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  const { agentId } = useParams()

  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-background"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex h-full flex-col items-center justify-center p-0 bg-background">
        {agentId ? (
          <AgentSettingsPanel agentId={agentId} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4">
            <Bot className="size-6 text-muted-foreground/40" />
            <div className="text-center text-xs text-muted-foreground">
              Select an agent or project
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
