import { Layers, Users, ClipboardCheck, Timer, MessageCircle, Monitor } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Layers;
};

export const mainNavItems: NavItem[] = [
  { id: 'projects',      label: 'Projects',      icon: Layers },
  { id: 'employees',     label: 'Employees',     icon: Users },
  { id: 'tickets',       label: 'Tickets',       icon: ClipboardCheck },
  { id: 'automations',   label: 'Automations',  icon: Timer },
  { id: 'communications', label: 'Communications', icon: MessageCircle },
  { id: 'remote',        label: 'Remote',        icon: Monitor },
];
