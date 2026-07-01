import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import log from 'electron-log/main';
import { createClient, type Client, type InValue } from '@libsql/client';

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

app.whenReady().then(() => {
  log.info('App ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
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
