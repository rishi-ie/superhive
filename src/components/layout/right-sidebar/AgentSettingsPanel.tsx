import { HugeiconsIcon } from "@/components/ui/icon";
import {
  AlertCircleIcon,
  RefreshIcon,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { restartAgent } from "@/flows/agents/runtime/restart-agent";

interface AgentSettingsPanelProps {
  agentId: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  running: "default",
  busy: "default",
  initializing: "secondary",
  stopped: "destructive",
  error: "destructive",
};

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b border-sidebar-border bg-sidebar px-0">
        <Avatar size="sm">
          <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
            {initials(settings.name)}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {settings.name ?? "Agent"}
        </span>
        <Badge
          variant={STATUS_VARIANT[status] ?? "secondary"}
          className="text-xs opacity-60 px-1.5 py-0"
        >
          {status}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => void restartAgent(agentId)}
          disabled={status === "initializing"}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        </Button>
      </div>

      {/* Tabs */}
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

        {/* Overview */}
        <TabsContent value="overview" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div>
              <OverviewSection settings={settings} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Manage */}
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

        {/* Inbox */}
        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <InboxSection
            settings={settings}
            agentId={agentId}
            patch={autoSave.patch}
            flush={autoSave.flush}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
