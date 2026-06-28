export type CenterTabType =
  | 'home'
  | 'projects'
  | 'project'
  | 'tickets'
  | 'channels'
  | 'channel'
  | 'agents'
  | 'agent'
  | 'universal-agents'
  | 'universal-projects'
  | 'universal-channels'
  | 'settings';

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
