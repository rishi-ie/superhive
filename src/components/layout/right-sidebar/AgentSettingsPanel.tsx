import * as React from "react";
import { Icon } from "@/components/ui/icon";
import {
  WarningCircleIcon,
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { useAgentSettings } from "@/flows/agents/settings";
import { useAutoSave } from "./use-auto-save";
import {
  MANAGE_SECTIONS,
  InboxSection,
} from "./sections/registry";
import { OverviewSection, type OverviewData } from "./sections/OverviewSection";
import { ResponsibilitySlider } from "./primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface AgentSettingsPanelProps {
  agentId: string;
}

export function AgentSettingsPanel({ agentId }: AgentSettingsPanelProps) {
  const { settings, isLoading, error, reload } = useAgentSettings(agentId);
  const autoSave = useAutoSave(agentId, reload);

  const overviewData = React.useMemo<OverviewData>(() => ({
    name: settings?.name ?? "Untitled agent",
    description: settings?.description ?? "",
    roleSummary: "Autonomous coding agent that reviews pull requests, writes tests, and refactors legacy modules with minimal supervision.",
    previousTasks: [
      { name: "Audit settings page", cost: 0.31 },
      { name: "Fix nav alignment", cost: 0.04 },
      { name: "Refactor onboarding flow", cost: 0.12 },
    ],
    activeChecklist: {
      taskName: "Building API integration",
      items: [
        { text: "Pull API spec", done: false },
        { text: "Define response types", done: true },
        { text: "Implement POST /orders", done: false },
        { text: "Add error handling", done: false },
      ],
    },
    recentActivity: [
      { type: "run", label: "implement POST /orders", timestamp: "just now" },
      { type: "edit", label: "src/api/orders.ts", timestamp: "2m ago" },
      { type: "message", label: '"Define response types"', timestamp: "5m ago" },
      { type: "tool", label: "npm test", timestamp: "8m ago" },
      { type: "edit", label: "src/lib/types.ts", timestamp: "12m ago" },
      { type: "run", label: "install pi-truth", timestamp: "1h ago" },
      { type: "message", label: '"Pull API spec"', timestamp: "2h ago" },
      { type: "tool", label: "git diff", timestamp: "3h ago" },
    ],
    responsibilityCount: 8,
  }), [settings]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-4 rounded-full border border-muted-foreground/30 border-t-muted-foreground/60 animate-spin" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-gap-loose p-card">
        <Icon icon={WarningCircleIcon} className="size-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{error ?? "No settings found"}</p>
        <Button variant="ghost" size="sm" className="h-7 gap-list-item text-xs" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-button-x">
      <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col">
        <TabsList className="w-full h-8 justify-center bg-white dark:bg-[#1a1a1a]">
          <TabsTrigger value="overview" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-muted data-[state=active]:text-foreground">
            <Icon icon={BookOpenTextIcon} className="size-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-muted data-[state=active]:text-foreground">
            <Icon icon={TreeViewIcon} className="size-3.5" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="inbox" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-muted data-[state=active]:text-foreground">
            <Icon icon={TrayIcon} className="size-3.5" />
            Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 flex flex-1 flex-col min-h-0 p-0">
          <ScrollArea className="flex-1 min-h-0">
            <OverviewSection data={overviewData} />
          </ScrollArea>
          <div className="mt-auto pb-gap-loose">
            <ResponsibilitySlider count={overviewData.responsibilityCount} />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full" scrollbar={false}>
            <div className="flex flex-col gap-5">
              {MANAGE_SECTIONS.map((s) => (
                <div key={s.id} className="flex flex-col gap-stack">
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

    </div>
  );
}
