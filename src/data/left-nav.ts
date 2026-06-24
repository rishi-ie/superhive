import { Layers, Users, ClipboardCheck, MessageCircle, Monitor, Hexagon } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Layers;
};

export const mainNavItems: NavItem[] = [
  { id: 'projects',      label: 'Projects',      icon: Layers },
  { id: 'agents',        label: 'Agents',        icon: Users },
  { id: 'tickets',       label: 'Tickets',       icon: ClipboardCheck },
  { id: 'communications', label: 'Communications', icon: MessageCircle },
  { id: 'meta-hive',     label: 'Meta Hive',     icon: Hexagon },
  { id: 'remote',        label: 'Remote',        icon: Monitor },
];

// Canonical nav-item IDs must match the keys used in Dashboard.handleNavItemClick.
// These are NOT the same as CenterTabType values — they are an intermediate set:
//   'projects'       → 'universal-projects'
//   'agents'         → 'universal-agents'
//   'tickets'        → 'tickets'
//   'communications'  → 'channels'
//   'meta-hive'      → (Coming Soon, no tab)
//   'remote'         → (Coming Soon, no tab)

