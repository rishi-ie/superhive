/**
 * okf — OKF (Open Knowledge Format) bundle metadata.
 *
 * OKF bundles are directories of markdown files on disk at ~/.superhive/okf/<project_id>/.
 * This module tracks bundle metadata in SQLite and provides file-system helpers via
 * Electron IPC (since the renderer cannot access the filesystem directly).
 *
 * The actual .md files are NOT in the DB — only the root path and sync metadata.
 */
export type OkfConcept = {
  path: string;
  title: string;
  type: string;
};

export type OkfBundle = {
  projectId: string;
  rootPath: string;
  lastSyncedAt: string | null;
  entryCount: number;
};
