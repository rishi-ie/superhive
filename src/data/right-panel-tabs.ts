import { Eye, Settings, Inbox } from 'lucide-react';

export const rightPanelTabs = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'manage', label: 'Manage', icon: Settings },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
] as const;
