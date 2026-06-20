import type { Notification } from './notifications';

export type OverviewItem = {
  id: string;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  tasks: number;
};

export type InboxItem = Notification & {};

export const overviewStats: OverviewItem[] = [
  { id: 'stat-1', label: 'Active Projects', value: '12', change: '+3 this week', positive: true },
  { id: 'stat-2', label: 'Tasks Completed', value: '47', change: '+12 vs last week', positive: true },
  { id: 'stat-3', label: 'Team Members', value: '8', change: '2 pending invite', positive: false },
  { id: 'stat-4', label: 'AI Model Calls', value: '1.2k', change: '+24% efficiency', positive: true },
];

export const teamMembers: TeamMember[] = [
  { id: 'emp-ava', name: 'Ava Chen', role: 'Lead Designer', status: 'active', tasks: 3 },
  { id: 'emp-marcus', name: 'Marcus Webb', role: 'Senior Engineer', status: 'busy', tasks: 5 },
  { id: 'emp-priya', name: 'Priya Sharma', role: 'Backend Engineer', status: 'active', tasks: 2 },
  { id: 'emp-james', name: 'James Liu', role: 'Frontend Engineer', status: 'idle', tasks: 1 },
  { id: 'emp-sonia', name: 'Sonia Patel', role: 'Product Manager', status: 'active', tasks: 4 },
];
