import type { ReactNode } from 'react';

export type FavoriteRef = {
  id: string;
  type: 'project' | 'employee';
};

export type FavoriteItem = FavoriteRef & {
  label: string;
  icon: ReactNode;
};
