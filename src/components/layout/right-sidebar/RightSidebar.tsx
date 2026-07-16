import { useMatch } from 'react-router-dom';
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
  // RightSidebar is mounted by AppLayout (the parent route) and therefore
  // can't read child route params via useParams(). Match against the child
  // route patterns instead to extract agentId / projectId.
  const agentMatch = useMatch('/agents/:agentId');
  const projectMatch = useMatch('/projects/:projectId');
  const isAgentsList = useMatch('/agents') !== null;
  const agentId = agentMatch?.params.agentId;
  const projectId = projectMatch?.params.projectId;

  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-background"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex h-full flex-col items-stretch bg-background p-0 pt-12">
        {agentId ? (
          <AgentSettingsPanel agentId={agentId} />
        ) : projectId ? (
          <ProjectSettingsPanel projectId={projectId} />
        ) : isAgentsList ? (
          <AgentsListPanel />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-stack p-card">
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
