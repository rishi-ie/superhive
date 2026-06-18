import { Layers, Timer, ClipboardCheck } from 'lucide-react';

export const navItems = [
  { id: 'workspaces', label: 'Workspaces', icon: Layers },
  { id: 'automations', label: 'Automations', icon: Timer },
  { id: 'tasks', label: 'Tasks & PRs', icon: ClipboardCheck },
] as const;
