import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import log from 'electron-log/main';
import { createClient, type Client, type InValue } from '@libsql/client';
import { spawnPty, writePty, resizePty, killPty, listPtyIds } from './agent-host';

const __dirname = dirname(fileURLToPath(import.meta.url));

log.initialize();
log.info('Superhive starting...');

let mainWindow: BrowserWindow | null = null;

function toggleMaximize() {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Superhive',
    backgroundColor: '#151110',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 18 },
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();
  mainWindow.show();

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    log.info('Loading dev server:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    log.info('Loading production build');
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('window:toggle-maximize', () => {
  toggleMaximize();
});

/**
 * Returns the path to the app's user data directory.
 * Used by the renderer to resolve .superhive/ paths.
 */
ipcMain.handle('app:get-data-dir', () => {
  return app.getPath('userData');
});

/**
 * Reads settings from .superhive/settings.json in the user data directory.
 * Falls back to empty object if file doesn't exist.
 */
ipcMain.handle('settings:read', () => {
  const settingsPath = join(app.getPath('userData'), '.superhive', 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      return fs.readFileSync(settingsPath, 'utf-8');
    }
  } catch (err) {
    log.error('Failed to read settings:', err);
  }
  return null;
});

/**
 * Writes settings to .superhive/settings.json in the user data directory.
 */
ipcMain.handle('settings:write', (_event, content: string) => {
  const baseDir = join(app.getPath('userData'), '.superhive');
  const settingsPath = join(baseDir, 'settings.json');
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, content, 'utf-8');
    return true;
  } catch (err) {
    log.error('Failed to write settings:', err);
    return false;
  }
});

/* ─── libSQL data backend ─────────────────────────────────────────────────── */

let dbClient: Client | null = null;

async function getDbClient(): Promise<Client> {
  if (dbClient) return dbClient;
  const dataDir = app.getPath('userData');
  const baseDir = join(dataDir, '.superhive');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  const url = process.env.LIBSQL_URL ?? `file:${join(baseDir, 'data.db')}`;
  dbClient = createClient({ url });
  log.info('libSQL DB opened:', url.startsWith('file:') ? url.replace('file:', '') : url);
  return dbClient;
}

ipcMain.handle('db:query', async (_event, sql: string, args?: unknown[]) => {
  try {
    const client = await getDbClient();
    const result = await client.execute({ sql, args: (args ?? []) as InValue[] });
    return { rows: result.rows ?? [] };
  } catch (err) {
    log.error('db:query error:', err);
    throw err;
  }
});

ipcMain.handle('db:execute', async (_event, sql: string, args?: unknown[]) => {
  try {
    const client = await getDbClient();
    const result = await client.execute({ sql, args: (args ?? []) as InValue[] });
    return { rowsAffected: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
  } catch (err) {
    log.error('db:execute error:', err);
    throw err;
  }
});

ipcMain.handle('db:batch', async (_event, stmts: Array<{ sql: string; args?: unknown[] }>) => {
  try {
    const client = await getDbClient();
    await client.batch(stmts.map((s) => ({ sql: s.sql, args: (s.args ?? []) as InValue[] })));
  } catch (err) {
    log.error('db:batch error:', err);
    throw err;
  }
});

ipcMain.handle('db:exec-multi', async (_event, sql: string) => {
  try {
    const client = await getDbClient();
    await client.executeMultiple(sql);
  } catch (err) {
    log.error('db:exec-multi error:', err);
    throw err;
  }
});

/* ─── OKF file-system handlers ──────────────────────────────────────────── */

ipcMain.handle('okf:get-data-dir', () => {
  return join(app.getPath('userData'), '.superhive', 'okf');
});

ipcMain.handle('okf:bundle-exists', (_event, projectId: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  return fs.existsSync(bundleDir);
});

ipcMain.handle('okf:create-bundle', (_event, projectId: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }
  return true;
});

ipcMain.handle('okf:read-bundle', async (_event, projectId: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (!fs.existsSync(bundleDir)) return {};
  const result: Record<string, { frontmatter: Record<string, unknown>; body: string }> = {};
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const filePath = join(bundleDir, entry.name);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseOkfFile(raw);
      result[entry.name] = { frontmatter, body };
    }
  }
  return result;
});

ipcMain.handle('okf:write-concept', (_event, projectId: string, path: string, frontmatter: Record<string, unknown>, body: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }
  const filePath = join(bundleDir, path);
  const yaml = Object.entries(frontmatter).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
  fs.writeFileSync(filePath, `---\n${yaml}\n---\n${body}`, 'utf-8');
  return true;
});

ipcMain.handle('okf:delete-bundle', (_event, projectId: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (fs.existsSync(bundleDir)) {
    fs.rmSync(bundleDir, { recursive: true, force: true });
    log.info(`Deleted OKF bundle for project ${projectId}`);
  }
  return true;
});

ipcMain.handle('okf:delete-all-bundles', () => {
  const okfRoot = join(app.getPath('userData'), '.superhive', 'okf');
  if (fs.existsSync(okfRoot)) {
    fs.rmSync(okfRoot, { recursive: true, force: true });
    log.info('Deleted all OKF bundles');
  }
  return true;
});

type OkfTreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children?: OkfTreeNode[];
};

function buildTree(root: string, base: string): OkfTreeNode {
  const stat = fs.statSync(root);
  const rel = relative(base, root);
  if (stat.isFile()) {
    return { name: base.split('/').pop() ?? root, path: rel, isDir: false };
  }
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return {
    name: base.split('/').pop() ?? root,
    path: rel,
    isDir: true,
    children: entries
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((e) => buildTree(join(root, e.name), e.name)),
  };
}

ipcMain.handle('okf:list-tree', (_event, projectId: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (!fs.existsSync(bundleDir)) return null;
  return buildTree(bundleDir, projectId);
});

ipcMain.handle('okf:read-concept', (_event, projectId: string, path: string) => {
  const filePath = join(app.getPath('userData'), '.superhive', 'okf', projectId, path);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseOkfFile(raw);
});

ipcMain.handle('okf:search', (_event, projectId: string, query: string) => {
  const bundleDir = join(app.getPath('userData'), '.superhive', 'okf', projectId);
  if (!fs.existsSync(bundleDir)) return [];
  const q = query.toLowerCase();
  const results: Array<{ path: string; preview: string }> = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf-8');
        if (content.toLowerCase().includes(q)) {
          const rel = relative(bundleDir, full);
          const idx = content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const preview = (start > 0 ? '…' : '') + content.slice(start, idx + 60).replace(/\n/g, ' ');
          results.push({ path: rel, preview });
        }
      }
    }
  };
  walk(bundleDir);
  return results.slice(0, 50);
});

ipcMain.handle('agents:terminate-all', () => {
  log.info('Terminating all agent processes (best-effort)');
  return true;
});

ipcMain.handle('agents:terminate', (_event, ulid: string) => {
  log.info(`Terminating agent process: ${ulid}`);
  return true;
});

function parseOkfFile(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const yamlStr = match[1]!;
  const body = match[2]!;
  const frontmatter: Record<string, unknown> = {};
  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    try { frontmatter[key] = JSON.parse(val); } catch { frontmatter[key] = val; }
  }
  return { frontmatter, body };
}

import { startWsServer, stopWsServer } from './ws-server';

/* ─── PTY agent host ─────────────────────────────────────────────────────── */

ipcMain.handle('pty:spawn', (_event, id: string, agentPath: string, cols = 80, rows = 24) => {
  return spawnPty(id, agentPath, cols, rows);
});

ipcMain.handle('pty:write', (_event, id: string, data: string) => {
  return writePty(id, data);
});

ipcMain.handle('pty:resize', (_event, id: string, cols: number, rows: number) => {
  return resizePty(id, cols, rows);
});

ipcMain.handle('pty:kill', (_event, id: string) => {
  return killPty(id);
});

ipcMain.handle('pty:list', () => {
  return listPtyIds();
});

app.whenReady().then(() => {
  log.info('App ready');
  startWsServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  stopWsServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
