import type { FavoriteItem } from './interface';

interface FavoritesApi {
  list(): Promise<FavoriteItem[]>;
}

export const favoritesApi: FavoritesApi = {
  list() {
    throw new Error('Not implemented — replace with real API call');
  },
};
