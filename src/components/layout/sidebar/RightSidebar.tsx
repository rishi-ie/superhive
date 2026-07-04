import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, FolderOpen } from "lucide-react";
import { usePicker } from "@/providers/picker-provider";

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  const { selectedAgentName, selectedProjectName, selectedAgentId, selectedProjectId } = usePicker();

  const entityName = selectedAgentName ?? selectedProjectName ?? null;
  const hasEntity = Boolean(entityName);
  const isAgent = Boolean(selectedAgentId);
  const isProject = Boolean(selectedProjectId);

  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex flex-col gap-0 p-0">
        {hasEntity ? (
          <>
            <div className="flex items-center gap-2 border-b border-sidebar-border p-3">
              {isAgent && <Bot className="size-4 text-[#7c3aed]" />}
              {isProject && <FolderOpen className="size-4 text-[#2563eb]" />}
              <span className="text-xs font-medium text-foreground truncate">{entityName}</span>
            </div>
            <Tabs defaultValue="sessions" className="flex flex-1 flex-col">
              <TabsList className="mx-2 mt-2 h-8 w-auto justify-start gap-1 rounded-lg bg-muted p-[3px]">
                <TabsTrigger value="sessions" className="h-7 px-2 text-xs">Sessions</TabsTrigger>
                <TabsTrigger value="settings" className="h-7 px-2 text-xs">Settings</TabsTrigger>
                <TabsTrigger value="stats" className="h-7 px-2 text-xs">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="sessions" className="mt-2 flex-1 px-3">
                <div className="text-xs text-muted-foreground">{entityName} sessions</div>
              </TabsContent>
              <TabsContent value="settings" className="mt-2 flex-1 px-3">
                <div className="text-xs text-muted-foreground">{entityName} settings</div>
              </TabsContent>
              <TabsContent value="stats" className="mt-2 flex-1 px-3">
                <div className="text-xs text-muted-foreground">{entityName} stats</div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <Bot className="size-6 text-muted-foreground/40" />
            <div className="text-center text-xs text-muted-foreground">
              Select an agent or project
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
