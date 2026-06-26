import type { IconKey } from '@/data/mock/types';

export type FavoriteRef = {
  id: string;
  type: 'project' | 'agent';
};

export type FavoriteItem = FavoriteRef & {
  label: string;
  iconKey: IconKey;
};
