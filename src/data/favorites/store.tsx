/**
 * Favorites store — owns the favorites list.
 *
 * This is the FIX for the old cross-domain bypass wart:
 * previously read mockableData.projects.find() / mockableData.agents.find()
 * directly. Now delegates through FavoritesRepository which uses
 * DataSource.projects / DataSource.agents properly.
 */
import { getDataSource } from '@/data/datasource/index';
import { FavoritesRepository } from './repository';
import type { FavoriteRef, FavoriteItem } from './interface';

const repo = new FavoritesRepository(getDataSource());

export function listFavorites(): FavoriteItem[] {
  return repo.list();
}

export type { FavoriteRef, FavoriteItem };
