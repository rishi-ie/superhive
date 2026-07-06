import { Settings, RotateCw, AlertCircle } from 'lucide-react'
import { useAgentSettings } from '@/flows/agents/settings/use-agent-settings'
import { useAgentRuntime } from '@/flows/agents/runtime/use-agent-runtime'
import { restartAgent } from '@/flows/agents/runtime/restart-agent'
import { useAutoSave } from './use-auto-save'
import { SETTING_SECTIONS } from './sections/registry'
import { RestartBar } from './RestartBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AgentSettingsPanelProps {
  agentId: string
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  running: 'default',
  busy: 'default',
  initializing: 'secondary',
  stopped: 'destructive',
  error: 'destructive',
}

export function AgentSettingsPanel({ agentId }: AgentSettingsPanelProps) {
  const { settings, isLoading, error, reload } = useAgentSettings(agentId)
  const { status } = useAgentRuntime(agentId)
  const autoSave = useAutoSave(agentId, reload)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <AlertCircle className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{error ?? 'No settings found'}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void reload()}>
            Retry
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void restartAgent(agentId)}>
            <RotateCw className="size-3.5" />
            Restart
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <Settings className="size-4 text-muted-foreground" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">Agent Settings</span>
        <Badge variant={STATUS_VARIANT[status] ?? 'secondary'} className="text-xs px-1.5 py-0.5">
          {status}
        </Badge>
      </div>

      <Tabs defaultValue={SETTING_SECTIONS[0]?.id} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-9 px-2 gap-1">
          {SETTING_SECTIONS.map(s => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="gap-1.5 text-xs data-[state=active]:bg-sidebar-accent"
            >
              <s.icon className="size-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1 min-h-0">
          {SETTING_SECTIONS.map(s => (
            <TabsContent
              key={s.id}
              value={s.id}
              className="mt-0 p-0"
            >
              <s.Component
                settings={settings}
                agentId={agentId}
                patch={autoSave.patch}
                flush={autoSave.flush}
              />
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>

      <RestartBar agentId={agentId} status={status} />
    </div>
  )
}
