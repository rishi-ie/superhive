import { Layers, Users } from 'lucide-react';
import type { FavoriteItem } from './interface';

const favorites: FavoriteItem[] = [
  { id: 'emp-ava',    label: 'Ava Chen',       type: 'employee', icon: <Users size={12} /> },
  { id: 'emp-marcus', label: 'Marcus Webb',    type: 'employee', icon: <Users size={12} /> },
  { id: 'superhive',  label: 'Superhive App',  type: 'project',  icon: <Layers size={12} /> },
  { id: 'mumbrane',  label: 'Mumbrane Platform', type: 'project', icon: <Layers size={12} /> },
  { id: 'sidharda-co', label: 'Sidharda Website', type: 'project', icon: <Layers size={12} /> },
];

export { favorites };
