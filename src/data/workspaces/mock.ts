import type { Workspace } from './interface';

const workspaces: Workspace[] = [
  { id: 'superhive', name: 'Superhive', initials: 'SH', avatarColor: 'bg-chart-1' },
  { id: 'mumbrane', name: 'Mumbrane', initials: 'MB', avatarColor: 'bg-chart-2' },
  { id: 'sidharda-co', name: 'Sidharda Co', initials: 'SC', avatarColor: 'bg-chart-3' },
  { id: 'personal', name: 'Personal', initials: 'PL', avatarColor: 'bg-[#8b5cf6]' },
];

const currentWorkspace: Workspace = workspaces[0]!;

export { workspaces, currentWorkspace };
