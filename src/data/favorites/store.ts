import { isMockEnabled } from '@/lib/feature-flags';
import { favorites } from './mock';
import type { FavoriteItem } from './interface';

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
