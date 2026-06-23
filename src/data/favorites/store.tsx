import { Layers, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData, IconKey } from '../mock-types';
import type { FavoriteItem } from './interface';

const data = mockData as MockData;

const ICONS: Record<IconKey, ReactNode> = {
  user: <Users size={12} />,
  folder: <Layers size={12} />,
};

const favorites: FavoriteItem[] = data.favorites.map(f => ({ ...f, icon: ICONS[f.iconKey] }));

interface FavoritesStore {
  list(): FavoriteItem[];
}

const emptyStore: FavoritesStore = {
  list() { return []; },
};

const mockStore: FavoritesStore = {
  list() { return favorites; },
};

const store: FavoritesStore = isMockEnabled('favorites') ? mockStore : emptyStore;

export function listFavorites(): FavoriteItem[] {
  return store.list();
}

export type { FavoriteItem };
