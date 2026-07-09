import { HugeiconsIcon } from "@/components/ui/icon";
import {
  AlertCircleIcon,
  Layout01Icon,
  Settings01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
import { useAgentSettings } from "@/flows/agents/settings";
import { useAgentRuntime } from "@/flows/agents/runtime";
import { useAutoSave } from "./use-auto-save";
import {
  MANAGE_SECTIONS,
  OverviewSection,
  InboxSection,
} from "./sections/registry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RestartBar } from "./RestartBar";

interface AgentSettingsPanelProps {
  agentId: string;
}

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
        <p className="text-xs text-muted-foreground">{error ?? "No settings found"}</p>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col">
        <TabsList className="h-9 w-full justify-start rounded-none border-b bg-transparent px-0 gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs cursor-default data-[state=active]:bg-sidebar-accent">
            <HugeiconsIcon icon={Layout01Icon} className="size-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-1.5 text-xs cursor-default data-[state=active]:bg-sidebar-accent">
            <HugeiconsIcon icon={Settings01Icon} className="size-3.5" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5 text-xs cursor-default data-[state=active]:bg-sidebar-accent">
            <HugeiconsIcon icon={InboxIcon} className="size-3.5" />
            Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div>
              <OverviewSection settings={settings} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-5">
              {MANAGE_SECTIONS.map((s) => (
                <div key={s.id} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {s.label}
                  </span>
                  <s.Component
                    settings={settings}
                    agentId={agentId}
                    patch={autoSave.patch}
                    flush={autoSave.flush}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <InboxSection
            settings={settings}
            agentId={agentId}
            patch={autoSave.patch}
            flush={autoSave.flush}
          />
        </TabsContent>
      </Tabs>

      <RestartBar agentId={agentId} status={status} />
    </div>
  );
}
