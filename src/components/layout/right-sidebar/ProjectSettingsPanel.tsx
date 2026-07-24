import {
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import { useAgentsListVersion, useAllAgentStatuses } from "@/flows/agents/runtime";
import {
  useAgentInbox,
  useAgentManage,
  useAgentOverview,
  useAgentSettings,
} from "@/flows/agents/settings";
import { useProjectHealth } from "@/flows/projects/health";
import { useProjectStaff } from "@/flows/projects/runtime";
import type { Agent, Project } from "@/storage/types";
import { ProjectOverviewSection } from "./sections/ProjectOverviewSection";
import { InboxSection } from "./sections/InboxSection";
import { MANAGE_SECTIONS, type ManageSectionDef } from "./sections/registry";
import type { ProjectOverviewSectionData } from "@/models/component";
import { Icon } from "@/components/ui/icon";

interface ProjectSettingsPanelProps {
  projectId: string;
}

interface TeamState {
  project: Project | null;
  coordinator: Agent | null;
  members: Agent[];
}

export function ProjectSettingsPanel({ projectId }: ProjectSettingsPanelProps) {
  const [team, setTeam] = useState<TeamState>({
    project: null,
    coordinator: null,
    members: [],
  });
  const agentsVersion = useAgentsListVersion();
  // Tracks whether we have ever resolved loadProjectTeam for *this* projectId.
  // Used to gate the team re-load spinner: only the very first load shows
  // loading; subsequent agentsVersion bumps (every manage.json write
  // triggers the fs watcher) refresh in the background without blanking the
  // sections.
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedOnceRef.current) {
      // No-op placeholder: we don't surface a spinner for the team load
      // anymore (the Team block was dropped from the Manage tab in gap 6;
      // Overview + Inbox fetch this data on demand).
      hasLoadedOnceRef.current = true;
    }
    loadProjectTeam(projectId)
      .then((t) => {
        if (cancelled) return;
        setTeam({
          project: t.project,
          coordinator: t.coordinator,
          members: t.members,
        });
      })
      .catch(() => {
        // loadProjectTeam never rejects today, but if it ever does we still
        // want the panel to render without crashing.
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, agentsVersion]);

  const liveIds = useMemo(() => {
    const ids: string[] = []
    if (team.coordinator) ids.push(team.coordinator.id)
    for (const m of team.members) ids.push(m.id)
    return ids
  }, [team.coordinator, team.members])
  const liveStates = useAllAgentStatuses(liveIds, liveIds.length > 0)

  const mergedTeam = useMemo<TeamState>(() => {
    const apply = (a: Agent | null): Agent | null => {
      if (!a) return null
      const live = liveStates.get(a.id)
      return live ? { ...a, status: live.status } : a
    }
    return {
      project: team.project,
      coordinator: apply(team.coordinator),
      members: team.members.map((m) => apply(m) ?? m),
    }
  }, [team, liveStates])

  const coordinatorId = mergedTeam.coordinator?.id ?? null;
  // 4-file split: each truth file has its own React flow. We read all
  // three so the catalog (skills/extensions/prompts) is available in
  // addition to the manage.json user-tweakable surface.
  //   settings.json → coordinatorSettings   (catalog.skills / .extensions / .prompts)
  //   manage.json   → coordinatorManage     (identity / behavior / permissions / active sets / planMode / project)
  //   overview.json → coordinatorOverview   (right-sidebar Overview snapshot)
  const coordinatorManage = useAgentManage(coordinatorId);
  const coordinatorOverview = useAgentOverview(coordinatorId);
  const coordinatorSettings = useAgentSettings(coordinatorId);
  // Phase D: feed the health derivation. Inbox items give us
  // lastInboxAt (most recent createdAt). The staff hook filters
  // agents by projectIds — the same filter the future "Spawned
  // staff" section in Phase G will reuse.
  const coordinatorInbox = useAgentInbox(coordinatorId)
  const { staff } = useProjectStaff(
    mergedTeam.project?.id ?? null,
    coordinatorId,
  )

  // Overview tab reads from overview.json (mirrored from manage by the truth ext).
  const coordinatorProjectDescription = useMemo<string | null>(() => {
    const ov = coordinatorOverview.settings as { description?: unknown } | null;
    if (!ov) return null;
    if (typeof ov.description !== "string") return null;
    const trimmed = ov.description.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, [coordinatorOverview.settings]);

  // Phase D: project health derived from live runtime + lastInboxAt.
  // Replace MOCK_HEALTH in the Overview section.
  const projectHealth = useProjectHealth({
    coordinator: mergedTeam.coordinator,
    staff,
    inboxItems: coordinatorInbox.items,
  })

  // Phase D: pass the full overview.json through. The ProjectOverviewSection
  // reads focus[] and activity[] from here.
  const overviewMirror = useMemo(() => {
    const ov = coordinatorOverview.settings
    if (!ov || typeof ov !== "object") return null
    return ov as unknown as ProjectOverviewSectionData["overview"]
  }, [coordinatorOverview.settings])

  // Gap 6: `members` is no longer rendered anywhere — Overview's "Team"
  // section now shows the project agent itself (the coordinator) as a
  // single card. The data stays loaded for future gaps; the renderer no
  // longer references it.
  const overviewData = useMemo<ProjectOverviewSectionData>(
    () => ({
      project: mergedTeam.project,
      coordinator: mergedTeam.coordinator,
      coordinatorProjectDescription,
      overview: overviewMirror,
      health: projectHealth,
      staff,
    }),
    [mergedTeam, coordinatorProjectDescription, overviewMirror, projectHealth, staff],
  )

  // Merge manage.json + the catalog slice of settings.json into one
  // object so sections can reach `settings.skills` (manage) and
  // `settings.catalog.skills` (settings) side by side.
  const coordinatorMergedManage = useMemo(() => {
    const manage = (coordinatorManage.settings ?? {}) as Record<string, unknown>;
    const settings = (coordinatorSettings.settings ?? {}) as Record<string, unknown>;
    const catalog = settings.catalog ?? manage.catalog;
    return { ...manage, catalog };
  }, [coordinatorManage.settings, coordinatorSettings.settings]);

  return (
    <div className="flex h-full flex-col px-button-x">
      <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col">
        <TabsList className="w-full h-8 justify-center bg-tabs-list-bg px-0.5">
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

        <TabsContent value="overview" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full" scrollbar={false}>
            <ProjectOverviewSection data={overviewData} liveStatuses={liveStates} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full" scrollbar={false}>
            <div className="flex flex-col gap-5">
              {coordinatorId ? (
                <ManageSectionList
                  sections={MANAGE_SECTIONS}
                  agentId={coordinatorId}
                  settings={coordinatorMergedManage}
                  patch={coordinatorManage.patch}
                />
              ) : null}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full" scrollbar={false}>
            <InboxSection agentId={coordinatorId} projectName={mergedTeam.project?.name} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ManageSectionListProps {
  sections: ManageSectionDef[];
  agentId: string;
  settings: Record<string, unknown>;
  patch: (key: string, value: unknown) => void;
}

function ManageSectionList({ sections, agentId, settings, patch }: ManageSectionListProps) {
  const project = (settings.project ?? {}) as { id?: string };
  const isCoordinator = Boolean(project.id);

  return (
    <>
      {sections.map((s) => {
        if (s.coordinatorOnly && !isCoordinator) return null;
        return (
          <div key={s.id} className="flex flex-col gap-stack">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {s.label}
            </span>
            <s.Component
              settings={settings}
              agentId={agentId}
              patch={patch}
            />
          </div>
        );
      })}
    </>
  );
}
