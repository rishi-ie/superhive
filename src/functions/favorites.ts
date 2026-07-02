/**
 * Pure favorite business logic extracted from data/favorite/store.ts.
 * These helpers operate on FavoriteItem arrays — they do not call DataSource.
 */
import type { FavoriteItem, FavoriteRef } from '@/data/favorite/interface';

/**
 * Determines whether a favorite should be added or removed given the current list.
 * @param current - Current favorite items
 * @param id - Item id to toggle
 * @returns 'add' if it should be added; 'remove' if it should be removed
 */
export function toggleFavoriteIntent(current: FavoriteItem[], id: string): 'add' | 'remove' {
  return current.some((e) => e.id === id) ? 'remove' : 'add';
}

/**
 * Type guard for FavoriteRef — checks that a value is a valid favorite reference.
 * @param value - Candidate value
 * @returns True if the value is a valid FavoriteRef
 */
export function isFavoriteRef(value: unknown): value is FavoriteRef {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { id?: unknown; type?: unknown };
  return typeof v.id === 'string' && typeof v.type === 'string';
}
