export type CenterTabType =
  | 'projects'           // workspace kanban dashboard
  | 'project'            // single project detail
  | 'tickets'           // workspace-wide tickets kanban
  | 'channels'          // workspace-wide channels list
  | 'channel'           // single channel detail
  | 'agents'            // workspace's agents list
  | 'agent'             // single agent — chat + telemetry
  | 'universal-agents'  // all agents across workspaces
  | 'universal-projects'// all projects across workspaces
  | 'universal-channels'// all channels across workspaces
  | 'settings';        // (future)

export type TabSelection = {
  selectedAgentId: string | null;
  selectedProjectId: string | null;
  selectedTicketId: string | null;
  selectedChannelId: string | null;
};

export type CenterTab = {
  id: string;
  type: CenterTabType;
  workspaceId: string;
  title: string;
  subtitle?: string;
  pinned?: boolean;
  modified?: boolean;
  selectedAgentId: string | null;
  selectedProjectId: string | null;
  selectedTicketId: string | null;
  selectedChannelId: string | null;
  createdAt: number;
};

export type TabState = {
  tabs: CenterTab[];
  activeTabId: string | null;
};
