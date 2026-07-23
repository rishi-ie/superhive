import { Icon } from "@/components/ui/icon";
import {
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useState } from "react";
import { loadProjectTeam, loadUnassignedAgents } from "@/flows/projects/crud/load-project-team";
import { useAllAgentStatuses } from "@/flows/agents/runtime";
import { useAgentSettings } from "@/flows/agents/settings";
import { assignAgentToProject, removeAgentFromProject } from "@/flows/projects/crud";
import type { Agent, Project } from "@/storage/types";
import { ProjectMembersList } from "./sections/ProjectMembersList";
import { AssignAgentDialog } from "./sections/AssignAgentDialog";
import { ProjectOverviewSection } from "./sections/ProjectOverviewSection";
import { PlanModeSection } from "./sections/PlanModeSection";
import { useAutoSave } from "./use-auto-save";
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
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    loadProjectTeam(projectId).then((t) =>
      setTeam({
        project: t.project,
        coordinator: t.coordinator,
        members: t.members,
      }),
    );
  }, [projectId]);

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

  // Read the coordinator's project description straight from truth
  // settings (Superhive-pi-<basename>.json → project.description). The
  // settings file is the only place the coordinator itself can write,
  // and `useAgentSettings` is wired to the settings-file watcher so
  // every truth tool write re-renders the overview tab for free.
  const coordinatorSettings = useAgentSettings(mergedTeam.coordinator?.id ?? null)
  const coordinatorAutoSave = useAutoSave(mergedTeam.coordinator?.id ?? null)
  const coordinatorProjectDescription = useMemo<string | null>(() => {
    const projectBlock = coordinatorSettings.settings?.project as
      | { description?: unknown }
      | undefined
    if (!projectBlock) return null
    const raw = projectBlock.description
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed.length === 0 ? null : trimmed
  }, [coordinatorSettings.settings])

  const overviewData = useMemo<ProjectOverviewSectionData>(
    () => ({
      project: mergedTeam.project,
      coordinator: mergedTeam.coordinator,
      members: mergedTeam.members,
      coordinatorProjectDescription,
    }),
    [mergedTeam, coordinatorProjectDescription],
  )

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
            <ProjectMembersList
              projectId={projectId}
              coordinator={mergedTeam.coordinator}
              members={mergedTeam.members}
              onAssignClick={() => setAssignOpen(true)}
              onRemove={async (agent) => {
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
              }}
            />
            {mergedTeam.coordinator && coordinatorSettings.settings ? (
              <div className="flex flex-col gap-stack px-card-x pt-gap-loose pb-card">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Plan Mode
                </span>
                <PlanModeSection
                  settings={coordinatorSettings.settings}
                  agentId={mergedTeam.coordinator.id}
                  patch={coordinatorAutoSave.patch}
                  flush={coordinatorAutoSave.flush}
                />
              </div>
            ) : null}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex h-full flex-col items-center justify-center gap-gap-loose text-center">
              <Icon icon={TrayIcon} className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                No pending requests from{" "}
                <span className="text-foreground/80">
                  {mergedTeam.project?.name ?? "this project"}
                </span>
                .
              </p>
            </div>
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
        onSelect={async (agentId) => {
          return assignAgentToProject({ projectId, agentId });
        }}
      />
    </div>
  );
}