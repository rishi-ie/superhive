import { Icon } from "@/components/ui/icon";
import {
  BookOpenTextIcon,
  TreeViewIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import type { Agent } from "@/storage/types";
import { ProjectMembersList } from "./sections/ProjectMembersList";

interface ProjectSettingsPanelProps {
  projectId: string;
}

interface TeamState {
  coordinator: Agent | null;
  members: Agent[];
}

export function ProjectSettingsPanel({ projectId }: ProjectSettingsPanelProps) {
  const [team, setTeam] = useState<TeamState>({ coordinator: null, members: [] });

  useEffect(() => {
    loadProjectTeam(projectId).then((t) =>
      setTeam({ coordinator: t.coordinator, members: t.members }),
    );
  }, [projectId]);

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
              coordinator={team.coordinator}
              members={team.members}
              onAssignClick={() => undefined}
              onRemove={() => undefined}
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
    </div>
  );
}