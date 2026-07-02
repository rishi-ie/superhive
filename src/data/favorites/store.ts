/**
 * Favorites store — owns the favorites list.
 *
 * Delegates through FavoritesRepository which uses DataSource.projects
 * and DataSource.agents via the DataSource interface.
 */
import { getDataSource } from '@/data/datasource/index';
import { FavoritesRepository } from './repository';
import type { FavoriteRef, FavoriteItem } from './interface';

const repo = new FavoritesRepository(getDataSource());

export function listFavorites(): FavoriteItem[] {
  return repo.list();
}

export function addFavorite(ref: FavoriteRef): FavoriteItem {
  return repo.add(ref);
}

export function removeFavorite(id: string): boolean {
  return repo.remove(id);
}

export function toggleFavorite(id: string, type: FavoriteRef['type']): boolean {
  const existing = repo.list();
  if (existing.some(e => e.id === id)) {
    return repo.remove(id);
  } else {
    repo.add({ id, type });
    return true;
  }
}

export type { FavoriteRef, FavoriteItem };
