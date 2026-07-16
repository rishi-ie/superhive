import { Icon } from "@/components/ui/icon";
import {
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useState } from "react";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import { useAllAgentStatuses } from "@/flows/agents/agent-store";
import type { Agent } from "@/storage/types";
import { ProjectMembersList } from "./sections/ProjectMembersList";
import { AssignAgentDialog } from "./sections/AssignAgentDialog";

interface ProjectSettingsPanelProps {
  projectId: string;
}

interface TeamState {
  coordinator: Agent | null;
  members: Agent[];
}

export function ProjectSettingsPanel({ projectId }: ProjectSettingsPanelProps) {
  const [team, setTeam] = useState<TeamState>({ coordinator: null, members: [] });
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    loadProjectTeam(projectId).then((t) =>
      setTeam({ coordinator: t.coordinator, members: t.members }),
    );
  }, [projectId]);

  const liveIds = useMemo(() => {
    const ids: string[] = []
    if (team.coordinator) ids.push(team.coordinator.id)
    for (const m of team.members) ids.push(m.id)
    return ids
  }, [team.coordinator, team.members])
  const liveStatuses = useAllAgentStatuses(liveIds, liveIds.length > 0)

  const mergedTeam = useMemo<TeamState>(() => {
    const apply = (a: Agent | null): Agent | null => {
      if (!a) return null
      const live = liveStatuses.get(a.id)
      return live ? { ...a, status: live } : a
    }
    return {
      coordinator: apply(team.coordinator),
      members: team.members.map((m) => apply(m) ?? m),
    }
  }, [team, liveStatuses])

  return (
    <div className="flex h-full flex-col px-button-x">
      <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col">
        <TabsList className="w-full h-8 justify-center bg-white dark:bg-[#1a1a1a] px-0.5">
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
            <div className="flex flex-col gap-4 py-button-y">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Project Overview
                </span>
                <span className="text-xs text-muted-foreground">
                  ID: {projectId}
                </span>
              </div>
              <div className="flex flex-col gap-gap-tight">
                <span className="text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              </div>
            </div>
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
                const { removeAgentFromProject } = await import(
                  "@/flows/projects/crud/remove-agent-from-project"
                );
                const r = await removeAgentFromProject({
                  projectId,
                  agentId: agent.id,
                });
                if (r.ok) {
                  const t = await loadProjectTeam(projectId);
                  setTeam({ coordinator: t.coordinator, members: t.members });
                }
              }}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <AssignAgentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() =>
          loadProjectTeam(projectId).then((t) =>
            setTeam({ coordinator: t.coordinator, members: t.members }),
          )
        }
        loadCandidates={async () => {
          const { loadUnassignedAgents } = await import("@/flows/projects/crud/load-project-team");
          const list = await loadUnassignedAgents();
          return list.map((a) => ({ id: a.id, name: a.name }));
        }}
        onSelect={async (agentId) => {
          const { assignAgentToProject } = await import("@/flows/projects/crud/assign-agent-to-project");
          return assignAgentToProject({ projectId, agentId });
        }}
      />
    </div>
  );
}