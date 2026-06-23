export type CenterTabType = 'chat' | 'projects' | 'tickets';

export type CenterTab = {
  id: string;
  type: CenterTabType;
  workspaceId: string;
  selectedTicketId: string | null;
};

export type TabState = {
  tabs: CenterTab[];
  activeTabId: string | null;
};
