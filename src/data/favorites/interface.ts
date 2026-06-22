import type { ReactNode } from 'react';

export type FavoriteItem = {
  id: string;
  label: string;
  type: 'project' | 'employee';
  icon?: ReactNode;
};
