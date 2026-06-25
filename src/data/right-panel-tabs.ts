import { Eye, Settings, Inbox, Clock, MessageSquare, BarChart3 } from 'lucide-react';

export type RightPanelTabId =
  | 'overview'
  | 'manage'
  | 'inbox'
  | 'sessions'
  | 'thread'
  | 'global-stats';

export type RightPanelContext =
  | { kind: 'agent'; agentId: string }
  | { kind: 'ticket'; ticketId: string }
  | { kind: 'project'; projectId: string; workspaceId: string }
  | { kind: 'channel'; channelId: string; workspaceId: string }
  | { kind: 'channels-list'; workspaceId: string }
  | { kind: 'agents-list'; workspaceId: string }
  | { kind: 'universal-agents' }
  | { kind: 'universal-projects' }
  | { kind: 'universal-channels' }
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
  { id: 'manage',    label: 'Manage',    icon: Settings },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
];

const channelTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
  { id: 'thread',    label: 'Thread',     icon: MessageSquare },
];

const channelsListTabs: RightPanelTab[] = [
  { id: 'global-stats', label: 'Stats', icon: BarChart3 },
];

const agentsListTabs: RightPanelTab[] = [
  { id: 'global-stats', label: 'Stats', icon: BarChart3 },
];

const universalAgentsTabs: RightPanelTab[] = [
  { id: 'global-stats', label: 'Stats', icon: BarChart3 },
];

const universalProjectsTabs: RightPanelTab[] = [
  { id: 'global-stats', label: 'Stats', icon: BarChart3 },
];

const universalChannelsTabs: RightPanelTab[] = [
  { id: 'global-stats', label: 'Stats', icon: BarChart3 },
];

export function getRightPanelTabs(context: RightPanelContext): RightPanelTab[] {
  if (!context) return [];
  switch (context.kind) {
    case 'agent': return agentTabs;
    case 'ticket': return ticketTabs;
    case 'project': return projectTabs;
    case 'channel': return channelTabs;
    case 'channels-list': return channelsListTabs;
    case 'agents-list': return agentsListTabs;
    case 'universal-agents': return universalAgentsTabs;
    case 'universal-projects': return universalProjectsTabs;
    case 'universal-channels': return universalChannelsTabs;
  }
}

export function getDefaultRightPanelTab(context: RightPanelContext): RightPanelTabId | null {
  const tabs = getRightPanelTabs(context);
  return tabs[0]?.id ?? null;
}
