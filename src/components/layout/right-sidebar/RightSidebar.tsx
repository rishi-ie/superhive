import { useParams } from 'react-router-dom';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { HugeiconsIcon } from "@/components/ui/icon";
import { UserIcon } from "@hugeicons/core-free-icons";
import { AgentSettingsPanel } from './AgentSettingsPanel';

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  const { agentId } = useParams();

  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex h-full flex-col items-stretch justify-start bg-sidebar p-0 pt-8">
        {agentId ? (
          <AgentSettingsPanel agentId={agentId} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4">
            <HugeiconsIcon icon={UserIcon} className="size-6 text-muted-foreground/40" />
            <div className="text-center text-xs text-muted-foreground">
              Select an agent or project
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
