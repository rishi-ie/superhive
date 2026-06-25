import { Eye, Settings, Inbox, Clock } from 'lucide-react';

export type RightPanelTabId =
  | 'overview'
  | 'manage'
  | 'inbox'
  | 'sessions';

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
  | { kind: 'dashboard' }
  | null;

export type RightPanelTab = {
  id: RightPanelTabId;
  label: string;
  icon: typeof Eye;
};

const ALL_TABS: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
  { id: 'sessions',  label: 'Sessions',  icon: Clock },
];

const CONTEXT_VISIBLE_TABS: Record<string, RightPanelTabId[]> = {
  agent:             ['overview', 'manage', 'inbox', 'sessions'],
  ticket:            ['overview', 'manage', 'inbox'],
  project:           ['overview', 'manage', 'inbox'],
  channel:           ['overview', 'manage', 'inbox'],
  'channels-list':   ['overview'],
  'agents-list':     ['overview'],
  'universal-agents': ['overview'],
  'universal-projects': ['overview'],
  'universal-channels': ['overview'],
  dashboard:         ['overview', 'inbox'],
};

export function getRightPanelTabs(context: RightPanelContext): RightPanelTab[] {
  if (!context) return [];
  const visible = CONTEXT_VISIBLE_TABS[context.kind] ?? [];
  return ALL_TABS.filter(t => visible.includes(t.id));
}

export function getDefaultRightPanelTab(context: RightPanelContext): RightPanelTabId | null {
  const tabs = getRightPanelTabs(context);
  return tabs[0]?.id ?? null;
}
