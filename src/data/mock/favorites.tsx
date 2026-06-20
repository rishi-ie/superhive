import { Layers, Users, Zap } from 'lucide-react';
import type { FavoriteItem } from '@/components/left-nav/FavoritesSection';

export const favorites: FavoriteItem[] = [
  { id: 'proj-1', label: 'Superhive App', type: 'project', icon: <Layers size={12} /> },
  { id: 'proj-2', label: 'Mumbrane Platform', type: 'project', icon: <Layers size={12} /> },
  { id: 'emp-1', label: 'Ava Chen', type: 'employee', icon: <Users size={12} /> },
  { id: 'proj-3', label: 'Sidharda Website', type: 'project', icon: <Layers size={12} /> },
  { id: 'emp-2', label: 'Marcus Webb', type: 'employee', icon: <Users size={12} /> },
];
