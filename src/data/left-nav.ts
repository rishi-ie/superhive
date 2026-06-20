import { Layers, Users, ClipboardCheck, Timer, Bell, MessageCircle } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Layers;
};

export const mainNavItems: NavItem[] = [
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'tickets', label: 'Tickets', icon: ClipboardCheck },
  { id: 'automations', label: 'Automations', icon: Timer },
  { id: 'communications', label: 'Communications', icon: MessageCircle },
];

export const bottomNavItems: NavItem[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
];
