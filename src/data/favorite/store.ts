/**
 * Favorites store — owns the favorites list.
 *
 * Delegates through FavoritesRepository which uses DataSource.projects
 * and DataSource.agents via the DataSource interface.
 */
import { getDataSource } from '@/data/datasource/index';
import { FavoritesRepository } from './repository';
import { toggleFavoriteIntent } from '@/functions/favorites';
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
  const intent = toggleFavoriteIntent(repo.list(), id);
  if (intent === 'remove') {
    return repo.remove(id);
  }
  repo.add({ id, type });
  return true;
}

export type { FavoriteRef, FavoriteItem };
