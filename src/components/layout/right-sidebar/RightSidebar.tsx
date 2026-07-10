import { useParams, useMatch } from 'react-router-dom';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { Icon } from "@/components/ui/icon";
import { UserIcon } from "@phosphor-icons/react";
import { AgentSettingsPanel } from './AgentSettingsPanel';
import { ProjectSettingsPanel } from './ProjectSettingsPanel';
import { AgentsListPanel } from './AgentsListPanel';

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  const { agentId, projectId } = useParams();
  const isAgentsList = useMatch('/agents') !== null;

  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-background"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex h-full flex-col items-stretch bg-background p-0 pt-8">
        {agentId ? (
          <AgentSettingsPanel agentId={agentId} />
        ) : projectId ? (
          <ProjectSettingsPanel projectId={projectId} />
        ) : isAgentsList ? (
          <AgentsListPanel />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <Icon icon={UserIcon} className="size-6 text-muted-foreground/40" />
            <div className="text-center text-xs text-muted-foreground">
              Select an agent or project
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
