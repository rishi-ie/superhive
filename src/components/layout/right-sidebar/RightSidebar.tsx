import { useLocation, useMatch } from 'react-router-dom';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { AgentSettingsPanel } from './AgentSettingsPanel';
import { ProjectSettingsPanel } from './ProjectSettingsPanel';
import { AgentsListPanel } from './AgentsListPanel';
import { RightSidebarWorkspace } from './RightSidebarWorkspace';
import { RIGHT_SIDEBAR_TABS } from './right-sidebar-tabs';
import { RouteSidebarPanel } from './RouteSidebarPanel';

const AGENTS_LIST_TABS = RIGHT_SIDEBAR_TABS.filter(
  (tab) => tab.id === 'overview' || tab.id === 'inbox',
);

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  const location = useLocation();
  // RightSidebar is mounted by AppLayout (the parent route) and therefore
  // can't read child route params via useParams(). Match against the child
  // route patterns instead to extract agentId / projectId.
  const agentMatch = useMatch('/agents/:agentId');
  const projectMatch = useMatch('/projects/:projectId');
  const isAgentsList = useMatch('/agents') !== null;
  const agentId = agentMatch?.params.agentId;
  const projectId = projectMatch?.params.projectId;
  const isLanding = location.pathname === '/';
  const contextKey = agentId
    ? `agent:${agentId}`
    : projectId
      ? `project:${projectId}`
      : isAgentsList
        ? 'agents:list'
        : location.pathname.slice(1) || 'landing';
  const tabs = isAgentsList ? AGENTS_LIST_TABS : RIGHT_SIDEBAR_TABS;

  return (
    <Sidebar
      className="relative h-full flex-shrink-0 bg-[#111111]"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 border-l border-sidebar-border" />
      <SidebarContent
        className="flex h-full flex-col items-stretch bg-[#111111] p-0 pt-0"
      >
        <RightSidebarWorkspace
          key={contextKey}
          contextKey={contextKey}
          tabs={tabs}
          renderTab={(activeTab) => {
            if (agentId) return <AgentSettingsPanel activeTab={activeTab} agentId={agentId} />;
            if (projectId) return <ProjectSettingsPanel activeTab={activeTab} projectId={projectId} />;
            if (isAgentsList) return <AgentsListPanel />;
            return <RouteSidebarPanel activeTab={activeTab} contextLabel={isLanding ? 'Workspace' : location.pathname.slice(1)} />;
          }}
        />
      </SidebarContent>
    </Sidebar>
  );
}
