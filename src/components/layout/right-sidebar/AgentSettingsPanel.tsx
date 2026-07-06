import { HugeiconsIcon } from "@/components/ui/icon";
import { UserIcon, AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { useAgentSettings } from '@/flows/agents/settings/use-agent-settings';
import { useAgentRuntime } from '@/flows/agents/runtime/use-agent-runtime';
import { useAutoSave } from './use-auto-save';
import { SETTING_SECTIONS } from './sections/registry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { restartAgent } from '@/flows/agents/runtime/restart-agent';

interface AgentSettingsPanelProps {
  agentId: string;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  running: 'default',
  busy: 'default',
  initializing: 'secondary',
  stopped: 'destructive',
  error: 'destructive',
};

export function AgentSettingsPanel({ agentId }: AgentSettingsPanelProps) {
  const { settings, isLoading, error, reload } = useAgentSettings(agentId);
  const { status } = useAgentRuntime(agentId);
  const autoSave = useAutoSave(agentId, reload);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-4 rounded-full border border-muted-foreground/30 border-t-muted-foreground/60 animate-spin" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{error ?? 'No settings found'}</p>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 items-center gap-2 px-3">
          <HugeiconsIcon icon={UserIcon} className="size-4 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-xs text-foreground">{settings.name ?? 'Agent'}</span>
        <Badge variant={STATUS_VARIANT[status] ?? 'secondary'} className="text-xs opacity-60 px-1.5 py-0">
          {status}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => void restartAgent(agentId)}
          disabled={status === 'initializing'}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="identity" className="flex flex-col flex-1 min-h-0">
        <TabsList className="h-9 w-full justify-start rounded-none border-b bg-transparent px-2 gap-1">
          {SETTING_SECTIONS.map(s => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="gap-1.5 text-xs cursor-default data-[state=active]:bg-sidebar-accent"
            >
              <s.icon className="size-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTING_SECTIONS.map(s => (
          <TabsContent key={s.id} value={s.id} className="mt-0 p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3">
                <s.Component
                  settings={settings}
                  agentId={agentId}
                  patch={autoSave.patch}
                  flush={autoSave.flush}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
