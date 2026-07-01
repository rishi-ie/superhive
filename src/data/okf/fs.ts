/**
 * okf/fs — file-system helpers for OKF bundles via Electron IPC.
 *
 * All paths live at ~/.superhive/okf/<project_id>/ in the user's home directory.
 * These functions are only callable from the renderer via IPC to main process.
 */

export type OkfFileEntry = {
  frontmatter: Record<string, unknown>;
  body: string;
};

export async function getOkfDataDir(): Promise<string> {
  return window.electron.okf.getDataDir();
}

export async function bundleExists(projectId: string): Promise<boolean> {
  return window.electron.okf.bundleExists(projectId);
}

export async function readBundle(projectId: string): Promise<Record<string, OkfFileEntry>> {
  return window.electron.okf.readBundle(projectId);
}

export async function writeConcept(projectId: string, path: string, frontmatter: Record<string, unknown>, body: string): Promise<void> {
  return window.electron.okf.writeConcept(projectId, path, frontmatter, body);
}

export async function createBundle(projectId: string): Promise<void> {
  return window.electron.okf.createBundle(projectId);
}
