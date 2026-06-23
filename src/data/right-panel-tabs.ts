import { Eye, Settings, Inbox, Clock, Layers } from 'lucide-react';

export type RightPanelTabId =
  | 'overview'
  | 'manage'
  | 'inbox'
  | 'sessions'
  | 'project';

export type RightPanelContext =
  | { kind: 'agent'; agentId: string }
  | { kind: 'ticket'; ticketId: string }
  | { kind: 'project'; projectId: string }
  | { kind: 'channel'; channelId: string }
  | null;

export type RightPanelTab = {
  id: RightPanelTabId;
  label: string;
  icon: typeof Eye;
};

const agentTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
  { id: 'sessions',  label: 'Sessions',  icon: Clock },
];

const ticketTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
];

const projectTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'project',   label: 'Project',   icon: Layers },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
];

const channelTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
];

export function getRightPanelTabs(context: RightPanelContext): RightPanelTab[] {
  if (!context) return [];
  switch (context.kind) {
    case 'agent': return agentTabs;
    case 'ticket':   return ticketTabs;
    case 'project':  return projectTabs;
    case 'channel':  return channelTabs;
  }
}

export function getDefaultRightPanelTab(context: RightPanelContext): RightPanelTabId | null {
  const tabs = getRightPanelTabs(context);
  return tabs[0]?.id ?? null;
}
