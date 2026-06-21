import type { ReactNode } from 'react';
import { Layers, Users } from 'lucide-react';

export type FavoriteItem = {
  id: string;
  label: string;
  type: 'project' | 'employee';
  icon?: ReactNode;
};

export const favorites: FavoriteItem[] = [
  { id: 'proj-1', label: 'Superhive App', type: 'project', icon: <Layers size={12} /> },
  { id: 'proj-2', label: 'Mumbrane Platform', type: 'project', icon: <Layers size={12} /> },
  { id: 'emp-1', label: 'Ava Chen', type: 'employee', icon: <Users size={12} /> },
  { id: 'proj-3', label: 'Sidharda Website', type: 'project', icon: <Layers size={12} /> },
  { id: 'emp-2', label: 'Marcus Webb', type: 'employee', icon: <Users size={12} /> },
];