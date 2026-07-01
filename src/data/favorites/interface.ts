export type IconKey = 'user' | 'folder';

export type FavoriteRef = {
  id: string;
  type: 'project' | 'agent';
};

export type FavoriteItem = FavoriteRef & {
  label: string;
  iconKey: IconKey;
};
