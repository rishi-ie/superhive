export type CenterTabType = 'chat' | 'projects' | 'tickets' | 'project' | 'channel';

export type CenterTab = {
  id: string;
  type: CenterTabType;
  workspaceId: string;
  selectedTicketId: string | null;
  selectedProjectId: string | null;
  selectedChannelId: string | null;
};

export type TabState = {
  tabs: CenterTab[];
  activeTabId: string | null;
};
