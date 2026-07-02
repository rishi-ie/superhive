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

export type OkfTreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children?: OkfTreeNode[];
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

export async function readConcept(projectId: string, path: string): Promise<OkfFileEntry | null> {
  return window.electron.okf.readConcept(projectId, path);
}

export async function writeConcept(projectId: string, path: string, frontmatter: Record<string, unknown>, body: string): Promise<void> {
  return window.electron.okf.writeConcept(projectId, path, frontmatter, body);
}

export async function listBundleTree(projectId: string): Promise<OkfTreeNode | null> {
  return window.electron.okf.listTree(projectId);
}

export async function searchBundle(projectId: string, query: string): Promise<Array<{ path: string; preview: string }>> {
  return window.electron.okf.search(projectId, query);
}

export async function createBundle(projectId: string): Promise<void> {
  return window.electron.okf.createBundle(projectId);
}

export async function deleteBundle(projectId: string): Promise<void> {
  return window.electron.okf.deleteBundle(projectId);
}

export async function deleteAllBundles(): Promise<void> {
  return window.electron.okf.deleteAllBundles();
}
