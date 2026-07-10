import { Icon } from "@/components/ui/icon";
import {
  SquaresFourIcon,
  GearIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectSettingsPanelProps {
  projectId: string;
}

export function ProjectSettingsPanel({ projectId }: ProjectSettingsPanelProps) {
  return (
    <div className="flex h-full flex-col px-3">
      <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col">
        <TabsList className="w-full h-8 justify-center bg-transparent p-0">
          <TabsTrigger value="overview" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-accent data-[state=active]:text-foreground">
            <Icon icon={SquaresFourIcon} className="size-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-accent data-[state=active]:text-foreground">
            <Icon icon={GearIcon} className="size-3.5" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="inbox" className="cursor-default justify-center px-0 py-0 !border-transparent data-[state=active]:bg-accent data-[state=active]:text-foreground">
            <Icon icon={TrayIcon} className="size-3.5" />
            Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Project Overview
                </span>
                <span className="text-xs text-muted-foreground">
                  ID: {projectId}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
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