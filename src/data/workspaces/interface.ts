export type Workspace = {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
  createdAt: string;
  retentionDays: number;
  archivedAt: string | null;
};
