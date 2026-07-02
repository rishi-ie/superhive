export type CenterTabType =
  | 'home'
  | 'project'
  | 'tickets'
  | 'ticket'
  | 'channels'
  | 'channel'
  | 'agents'
  | 'agent'
  | 'universal-agents'
  | 'universal-projects'
  | 'universal-channels'
  | 'workspace-agent'
  | 'project-agent';

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
