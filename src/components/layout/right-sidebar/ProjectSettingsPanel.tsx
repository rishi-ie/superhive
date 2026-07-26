import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import { useAgentRuntime, useAgentsListVersion, useAllAgentStatuses } from "@/flows/agents/runtime";
import {
  useAgentInbox,
  useAgentManage,
  useAgentOverview,
  useAgentSettings,
} from "@/flows/agents/settings";
import { useManageTabPatch } from "@/flows/agents/settings/use-manage-tab-patch";
import { useProjectHealth } from "@/flows/projects/health";
import { useProjectStaff } from "@/flows/projects/runtime";
import type { Agent, Project } from "@/storage/types";
import { ProjectOverviewSection } from "./sections/ProjectOverviewSection";
import { InboxSection } from "./sections/InboxSection";
import { MANAGE_SECTIONS, type ManageSectionDef } from "./sections/registry";
import type { ProjectOverviewSectionData, ManageFileState } from "@/models/component";
import type { RightSidebarTabId } from "./right-sidebar-tabs";

interface ProjectSettingsPanelProps {
  projectId: string;
  activeTab: RightSidebarTabId;
}

interface TeamState {
  project: Project | null;
  coordinator: Agent | null;
  members: Agent[];
}

export function ProjectSettingsPanel({ projectId, activeTab }: ProjectSettingsPanelProps) {
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
	const coordinatorRuntime = useAgentRuntime(coordinatorId ?? undefined)
  // 4-file split: each truth file has its own React flow. We read all
  // three so the catalog (skills/extensions/prompts) is available in
  // addition to the manage.json user-tweakable surface.
  //   settings.json → coordinatorSettings   (catalog.skills / .extensions / .prompts)
  //   manage.json   → coordinatorManage     (identity / behavior / permissions / active sets / project)
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

	const liveRuntimeSummary = useMemo(() => {
		if (coordinatorRuntime.retry) {
			return `Retrying (${coordinatorRuntime.retry.attempt}/${coordinatorRuntime.retry.maxAttempts})…`
		}
		if (coordinatorRuntime.compaction) return 'Compacting project context…'
		if (coordinatorRuntime.inFlightToolCount > 0) {
			return `Running ${coordinatorRuntime.inFlightToolCount} tool${coordinatorRuntime.inFlightToolCount === 1 ? '' : 's'}…`
		}
		if (coordinatorRuntime.inFlight?.activityTimeline.some((item) => item.kind === 'thinking' && item.state === 'streaming')) {
			return 'Thinking through the request…'
		}
		if (coordinatorRuntime.agentResponseActive) return 'Preparing a response…'
		if (coordinatorRuntime.pendingTurn) return 'Starting the project agent…'
		return null
	}, [
		coordinatorRuntime.agentResponseActive,
		coordinatorRuntime.compaction,
		coordinatorRuntime.inFlight,
		coordinatorRuntime.inFlightToolCount,
		coordinatorRuntime.pendingTurn,
		coordinatorRuntime.retry,
	])

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

  // Merge manage.json + settings.json (catalog + runtime essentials) into
  // one object so sections can reach `settings.skills` (manage),
  // `settings.catalog.skills` (settings), AND `settings.defaultThinkingLevel`
  // / `settings.runtime` (settings) side by side. Mirrors AgentSettingsPanel's
  // merge so the two panels stay in lockstep.
  const coordinatorMergedManage = useMemo<ManageFileState>(() => {
    const manage = (coordinatorManage.settings ?? {}) as ManageFileState;
    const settings = (coordinatorSettings.settings ?? {}) as ManageFileState;
    return { ...manage, ...settings, catalog: settings.catalog ?? manage.catalog } as ManageFileState;
  }, [coordinatorManage.settings, coordinatorSettings.settings]);

  // Routing patch: writes settings-only keys (defaultThinkingLevel +
  // runtime.thinkingLevel dual-write) to settings.json; everything else
  // goes to manage.json. Shared hook — see useManageTabPatch.
  const routingPatch = useManageTabPatch(coordinatorManage, coordinatorSettings);

  if (activeTab === "overview") {
    return (
      <div className="h-full px-button-x">
        <ScrollArea className="h-full" scrollbar={false}>
          <ProjectOverviewSection data={overviewData} liveStatuses={liveStates} liveRuntimeSummary={liveRuntimeSummary} />
        </ScrollArea>
      </div>
    );
  }

  if (activeTab === "inbox") {
    return (
      <div className="h-full px-button-x">
        <ScrollArea className="h-full" scrollbar={false}>
          <InboxSection agentId={coordinatorId} projectName={mergedTeam.project?.name} />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full px-button-x">
      <ScrollArea className="h-full" scrollbar={false}>
        <div className="flex flex-col gap-5">
          {coordinatorId ? (
            <ManageSectionList
              sections={MANAGE_SECTIONS}
              agentId={coordinatorId}
              settings={coordinatorMergedManage}
              patch={routingPatch}
            />
          ) : null}
        </div>
      </ScrollArea>
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
