import * as React from "react";
import { Icon } from "@/components/ui/icon";
import {
  WarningCircleIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useAgentManage, useAgentSettings } from "@/flows/agents/settings";
import { useManageTabPatch } from "@/flows/agents/settings/use-manage-tab-patch";
import { loadAgentProjects } from "@/flows/agents/crud/load-agent-projects";
import {
  MANAGE_SECTIONS,
  InboxSection,
  type ManageSectionDef,
} from "./sections/registry";
import { OverviewSection } from "./sections/OverviewSection";
import type { OverviewData, ManageFileState } from "@/models/component";
import { ResponsibilitySlider } from "./primitives";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import type { Project } from "@/storage/types";
import type { RightSidebarTabId } from "./right-sidebar-tabs";

interface AgentSettingsPanelProps {
  agentId: string;
  activeTab: RightSidebarTabId;
}

function scoreAtom(label: string, description: string | undefined, tokens: string[]): number {
  let s = 0;
  for (const t of tokens) {
    if (label.toLowerCase().includes(t)) {
      s += 10;
    } else if ((description ?? "").toLowerCase().includes(t)) {
      s += 5;
    } else {
      return 0;
    }
  }
  return s;
}

function sectionMatchesLabel(sec: ManageSectionDef, tokens: string[]): boolean {
  const haystack = `${sec.label} ${sec.description ?? ""}`.toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function AgentSettingsPanel({ agentId, activeTab }: AgentSettingsPanelProps) {
  const manage = useAgentManage(agentId);
  const settingsJson = useAgentSettings(agentId);

  // Merge manage.json (skills/extensions/etc) with settings.json (catalog +
  // runtime essentials) so sections can reach both under one `settings`
  // object — mirrors ProjectSettingsPanel's merge so the two panels stay
  // in lockstep. The catalog override stays so manage.json's catalog (if
  // any) loses to settings.json's truth.
  const settings = React.useMemo<ManageFileState>(() => {
    const m = (manage.settings ?? {}) as ManageFileState;
    const s = (settingsJson.settings ?? {}) as ManageFileState;
    return { ...m, ...s, catalog: s.catalog ?? m.catalog } as ManageFileState;
  }, [manage.settings, settingsJson.settings]);

  // Routing patch: settings-only keys (defaultThinkingLevel +
  // runtime.thinkingLevel dual-write) → settings.json; everything else →
  // manage.json. Shared with ProjectSettingsPanel via useManageTabPatch.
  // See AGENT_SETTINGS.md §17.
  const patch = useManageTabPatch(manage, settingsJson);

  const isLoading = manage.isLoading || settingsJson.isLoading;
  const error = manage.error ?? settingsJson.error;
  const reload = manage.reload;

  const [projects, setProjects] = React.useState<Project[]>([]);
  React.useEffect(() => {
    loadAgentProjects(agentId).then(setProjects);
  }, [agentId]);

  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (activeTab !== "manage") setQuery("");
  }, [activeTab]);

  const overviewData = React.useMemo<OverviewData>(() => ({
    name: (settings?.name as string | undefined) ?? (settings?.identity as { name?: string } | undefined)?.name ?? "Untitled agent",
    description: (settings?.description as string | undefined) ?? (settings?.identity as { description?: string } | undefined)?.description ?? "",
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
    projects,
  }), [settings, projects]);

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const rankedSections = React.useMemo(() => {
    if (!settings) return [];

    return MANAGE_SECTIONS
      .map((s) => {
        const labelMatch = tokens.length > 0 && sectionMatchesLabel(s, tokens);
        const atoms = s.getSearchableAtoms(settings);
        const atomScore = atoms.length > 0
          ? Math.max(...atoms.map((a) => scoreAtom(a.label, a.description, tokens)))
          : 0;
        const labelScore = labelMatch ? 10 : 0;
        const score = Math.max(labelScore, atomScore);
        const effectiveQuery = labelMatch ? "" : query;
        return { s, score, labelMatch, effectiveQuery };
      })
      .filter((r) => r.score > 0 || tokens.length === 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          MANAGE_SECTIONS.indexOf(a.s) - MANAGE_SECTIONS.indexOf(b.s),
      );
  }, [settings, query, tokens.join(" ")]);

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

  if (activeTab === "overview") {
    return (
      <div className="flex h-full flex-col px-button-x">
        <ScrollArea className="flex-1 min-h-0">
          <OverviewSection data={overviewData} />
        </ScrollArea>
        <div className="mt-auto pb-gap-loose">
          <ResponsibilitySlider count={overviewData.responsibilityCount} />
        </div>
      </div>
    );
  }

  if (activeTab === "inbox") {
    return <InboxSection agentId={agentId} />;
  }

  return (
    <div className="h-full px-button-x">
      <ScrollArea className="h-full" scrollbar={false}>
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Icon
              icon={MagnifyingGlassIcon}
              className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter settings"
              className="h-7 pl-7 pr-7 text-sm focus-visible:border-transparent focus-visible:ring-0"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-icon p-0.5 cursor-default text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon icon={XIcon} className="size-3.5" />
              </button>
            )}
          </div>

          {rankedSections.length === 0 && tokens.length > 0 ? (
            <Empty>
              <Icon icon={MagnifyingGlassIcon} className="size-8 text-muted-foreground/30" />
              <EmptyTitle>No settings match</EmptyTitle>
              <EmptyDescription>
                Try keywords like &ldquo;filesystem&rdquo;, &ldquo;skills&rdquo;, or &ldquo;network&rdquo;.
              </EmptyDescription>
              <Button variant="ghost" size="sm" className="mt-2 h-7" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </Empty>
          ) : (
            rankedSections.map(({ s, effectiveQuery }) => (
              <div key={s.id} className="flex flex-col gap-stack">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <s.Component
                  settings={settings}
                  agentId={agentId}
                  query={effectiveQuery}
                  patch={patch}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
