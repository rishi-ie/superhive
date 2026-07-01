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

export type { FavoriteRef, FavoriteItem };
