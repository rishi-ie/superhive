import { Eye, Settings, Inbox, Activity, Clock } from 'lucide-react';

export type RightPanelTabId =
  | 'overview'
  | 'manage'
  | 'inbox'
  | 'sessions'
  | 'progress';

export type RightPanelContext =
  | { kind: 'employee'; employeeId: string }
  | { kind: 'ticket'; ticketId: string }
  | { kind: 'project'; projectId: string }
  | { kind: 'channel'; channelId: string }
  | null;

export type RightPanelTab = {
  id: RightPanelTabId;
  label: string;
  icon: typeof Eye;
};

const employeeTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'manage',    label: 'Manage',    icon: Settings },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
  { id: 'sessions',  label: 'Sessions',  icon: Clock },
];

const ticketTabs: RightPanelTab[] = [
  { id: 'overview',  label: 'Overview',  icon: Eye },
  { id: 'progress',  label: 'Progress',  icon: Activity },
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
];

export function getRightPanelTabs(context: RightPanelContext): RightPanelTab[] {
  if (!context) return employeeTabs;
  switch (context.kind) {
    case 'employee': return employeeTabs;
    case 'ticket':   return ticketTabs;
    case 'project':  return projectTabs;
    case 'channel':  return channelTabs;
  }
}

export function getDefaultRightPanelTab(context: RightPanelContext): RightPanelTabId {
  const tabs = getRightPanelTabs(context);
  return tabs[0]?.id ?? 'overview';
}
