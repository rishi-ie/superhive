/**
 * Favorites repository — owns the favorites list.
 * Cross-domain reads (project/agent labels) delegate to those repositories.
 * This is the fix for the old favorites/store.tsx cross-domain bypass wart.
 */
import type { DataSource } from '@/data/datasource/types';
import type { FavoriteRef, FavoriteItem } from './interface';
import type { IconKey } from '@/data/mock/types';
import type { Project } from '@/data/projects/interface';
import type { Agent } from '@/data/agents/interface';

export class FavoritesRepository {
  constructor(private ds: DataSource) {}

  list(): FavoriteItem[] {
    return this.ds.favorites.findAll().map((ref) => this.resolve(ref));
  }

  private resolve(ref: FavoriteRef): FavoriteItem {
    if (ref.type === 'project') {
      const project = this.ds.projects.findById(ref.id) as Project | undefined;
      return { id: ref.id, type: 'project', label: project?.title ?? ref.id, iconKey: 'folder' as IconKey };
    } else {
      const agent = this.ds.agents.findById(ref.id) as Agent | undefined;
      return { id: ref.id, type: 'agent', label: agent?.name ?? ref.id, iconKey: 'user' as IconKey };
    }
  }

  add(ref: FavoriteRef): FavoriteItem {
    const created = this.ds.favorites.create(ref);
    return this.resolve(created);
  }
}

export function createFavoritesRepository(ds: DataSource): FavoritesRepository {
  return new FavoritesRepository(ds);
}
