import { Icon } from "@/components/ui/icon";
import {
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { useEffect, useMemo, useState } from "react";
import { loadProjectTeam, loadUnassignedAgents } from "@/flows/projects/crud/load-project-team";
import { useAgentsListVersion, useAllAgentStatuses } from "@/flows/agents/runtime";
import { useAgentManage, useAgentOverview, useAgentSettings } from "@/flows/agents/settings";
import { assignAgentToProject, removeAgentFromProject } from "@/flows/projects/crud";
import type { Agent, Project } from "@/storage/types";
import { ProjectMembersList } from "./sections/ProjectMembersList";
import { AssignAgentDialog } from "./sections/AssignAgentDialog";
import { ProjectOverviewSection } from "./sections/ProjectOverviewSection";
import { InboxSection } from "./sections/InboxSection";
import { MANAGE_SECTIONS, type ManageSectionDef } from "./sections/registry";
import type { ProjectOverviewSectionData } from "@/models/component";

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
  const [teamLoading, setTeamLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const agentsVersion = useAgentsListVersion();

  useEffect(() => {
    // Gap 5: re-run on `[projectId, agentsVersion]` so an agents-reconcile
    // that adopts a freshly-created coordinator mid-session refreshes the
    // panel. Without this, a project that opened before reconcile completed
    // could show a sticky empty-state.
    let cancelled = false;
    setTeamLoading(true);
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
        // want teamLoading to flip back to false so the UI isn't stuck on a
        // muted placeholder forever.
      })
      .finally(() => {
        if (cancelled) return;
        setTeamLoading(false);
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

  // Overview tab reads from overview.json (mirrored from manage by the truth ext).
  const coordinatorProjectDescription = useMemo<string | null>(() => {
    const ov = coordinatorOverview.settings as { description?: unknown } | null;
    if (!ov) return null;
    if (typeof ov.description !== "string") return null;
    const trimmed = ov.description.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, [coordinatorOverview.settings]);

  const overviewData = useMemo<ProjectOverviewSectionData>(
    () => ({
      project: mergedTeam.project,
      coordinator: mergedTeam.coordinator,
      members: mergedTeam.members,
      coordinatorProjectDescription,
    }),
    [mergedTeam, coordinatorProjectDescription],
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

  const handleAssign = async (agentId: string) => {
    const r = await assignAgentToProject({ projectId, agentId });
    if (r.ok) {
      const t = await loadProjectTeam(projectId);
      setTeam({
        project: t.project,
        coordinator: t.coordinator,
        members: t.members,
      });
    }
    return r;
  };

  const handleRemove = async (agent: Agent) => {
    const r = await removeAgentFromProject({
      projectId,
      agentId: agent.id,
    });
    if (r.ok) {
      const t = await loadProjectTeam(projectId);
      setTeam({
        project: t.project,
        coordinator: t.coordinator,
        members: t.members,
      });
    }
  };

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
          <ScrollArea className="h-full">
            <ProjectOverviewSection data={overviewData} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-stack px-card-x pt-gap-loose pb-card">
              <div className="flex flex-col gap-stack">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Team
                </span>
                <ProjectMembersList
                  projectId={projectId}
                  coordinator={mergedTeam.coordinator}
                  members={mergedTeam.members}
                  onAssignClick={() => setAssignOpen(true)}
                  onRemove={handleRemove}
                />
              </div>

              {!teamLoading && mergedTeam.coordinator ? (
                <ManageSectionList
                  sections={MANAGE_SECTIONS}
                  agentId={mergedTeam.coordinator.id}
                  settings={coordinatorMergedManage}
                  patch={coordinatorManage.patch}
                  flush={coordinatorManage.flush}
                />
              ) : !teamLoading ? (
                <Empty>
                  <EmptyTitle>No project coordinator assigned</EmptyTitle>
                  <EmptyDescription>
                    Assign a coordinator agent to this project so its manage.json
                    settings can render in this tab.
                  </EmptyDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 mt-2"
                    onClick={() => setAssignOpen(true)}
                  >
                    Assign
                  </Button>
                </Empty>
              ) : null}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <InboxSection agentId={coordinatorId} projectName={mergedTeam.project?.name} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <AssignAgentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() =>
          loadProjectTeam(projectId).then((t) =>
            setTeam({
              project: t.project,
              coordinator: t.coordinator,
              members: t.members,
            }),
          )
        }
        loadCandidates={async () => {
          const list = await loadUnassignedAgents();
          return list.map((a) => ({ id: a.id, name: a.name }));
        }}
        onSelect={handleAssign}
      />
    </div>
  );
}

interface ManageSectionListProps {
  sections: ManageSectionDef[];
  agentId: string;
  settings: Record<string, unknown>;
  patch: (key: string, value: unknown) => void;
  flush: (p: Record<string, unknown>) => Promise<void>;
}

function ManageSectionList({ sections, agentId, settings, patch, flush }: ManageSectionListProps) {
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
              flush={flush}
            />
          </div>
        );
      })}
    </>
  );
}
