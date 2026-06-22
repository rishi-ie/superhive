import { Layers, Users, ClipboardCheck, MessageCircle, Monitor, Hexagon } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Layers;
};

export const mainNavItems: NavItem[] = [
  { id: 'projects',      label: 'Projects',      icon: Layers },
  { id: 'employees',     label: 'Employees',     icon: Users },
  { id: 'tickets',       label: 'Tickets',       icon: ClipboardCheck },
  { id: 'communications', label: 'Communications', icon: MessageCircle },
  { id: 'meta-hive',     label: 'Meta Hive',     icon: Hexagon },
  { id: 'remote',        label: 'Remote',        icon: Monitor },
];
