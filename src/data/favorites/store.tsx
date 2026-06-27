import { mockableData } from '@/data/mock/index';
import type { FavoriteItem, FavoriteRef } from './interface';
import type { IconKey } from '@/data/mock/types';

function resolveFavorites(refs: FavoriteRef[]): FavoriteItem[] {
  return refs.map(ref => {
    let label: string;
    let iconKey: IconKey;
    if (ref.type === 'project') {
      const project = mockableData.projects.find(p => p.id === ref.id);
      label = project?.title ?? ref.id;
      iconKey = 'folder';
    } else {
      const agent = mockableData.agents.find(a => a.id === ref.id);
      label = agent?.name ?? ref.id;
      iconKey = 'user';
    }
    return { id: ref.id, type: ref.type, label, iconKey };
  });
}

const rawFavorites: FavoriteRef[] = mockableData.favorites as FavoriteRef[];
const resolvedFavorites = resolveFavorites(rawFavorites);

export function listFavorites(): FavoriteItem[] {
  return resolvedFavorites;
}

export type { FavoriteRef, FavoriteItem };