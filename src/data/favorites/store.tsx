import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '@/data/mock.json';
import type { MockData, IconKey } from '@/data/mock/types';
import type { FavoriteItem, FavoriteRef } from './interface';

const data = mockData as MockData;

function resolveFavorites(refs: FavoriteRef[]): FavoriteItem[] {
  return refs.map(ref => {
    let label: string;
    let iconKey: IconKey;
    if (ref.type === 'project') {
      const project = data.projects.find(p => p.id === ref.id);
      label = project?.title ?? ref.id;
      iconKey = 'folder';
    } else {
      const agent = data.agents.find(a => a.id === ref.id);
      label = agent?.name ?? ref.id;
      iconKey = 'user';
    }
    return { id: ref.id, type: ref.type, label, iconKey };
  });
}

const rawFavorites: FavoriteRef[] = data.favorites as FavoriteRef[];
const resolvedFavorites = resolveFavorites(rawFavorites);

interface FavoritesStore {
  list(): FavoriteItem[];
}

const emptyStore: FavoritesStore = {
  list() { return []; },
};

const mockStore: FavoritesStore = {
  list() { return resolvedFavorites; },
};

const store: FavoritesStore = isMockEnabled('favorites') ? mockStore : emptyStore;

export function listFavorites(): FavoriteItem[] {
  return store.list();
}

export type { FavoriteRef, FavoriteItem };
