import type { ReactNode } from 'react';

export type FavoriteRef = {
  id: string;
  type: 'project' | 'agent';
};

export type FavoriteItem = FavoriteRef & {
  label: string;
  icon: ReactNode;
};
