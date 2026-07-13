import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import { setUserDataPath } from '../src/storage/database';
import { seedWorkspace } from '../src/storage/seed';
import { registerIpc } from './ipc';
import { runtime } from './general-kai-runtime';
import { reconcileAgents } from './reconcile-agents';
import { reconcileRuntime } from './reconcile-runtime';
import { isGeneralKaiReady } from './install-general-kai';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const __dirname = dirname(fileURLToPath(import.meta.url));

app.setName('Superhive');

log.initialize();
log.info('Superhive starting...');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Superhive',
    backgroundColor: '#151110',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();
  mainWindow.show();

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

function setupAutoUpdater(window: BrowserWindow) {
  if (!app.isPackaged) return;
  log.info('[autoUpdater] starting update checks (every 1h)');

  autoUpdater.autoDownload = true;

  autoUpdater.on('update-available', (info) => {
    log.info(`[autoUpdater] update available: ${info.version}`);
    window.webContents.send('app:update-available', { version: info.version });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`[autoUpdater] update downloaded: ${info.version}`);
    window.webContents.send('app:update-downloaded', {
      version: info.version,
      releaseName: info.releaseName,
    });
  });

  autoUpdater.on('error', (err) => {
    log.warn(`[autoUpdater] error: ${err.message}`);
  });

  autoUpdater.checkForUpdates().catch((err: Error) =>
    log.warn(`[autoUpdater] initial check failed: ${err.message}`)
  );

  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err: Error) =>
      log.warn(`[autoUpdater] hourly check failed: ${err.message}`)
    );
  }, UPDATE_CHECK_INTERVAL_MS);
}

app.whenReady().then(async () => {
  log.info('App ready');

  setUserDataPath(app.getPath('userData'));
  log.info(`[main] userData = ${app.getPath('userData')}`);

  if (!isGeneralKaiReady()) {
    log.warn(
      '[main] general-kai template not found at ~/.superhive/general-kai-template/\n' +
      '[main] Agent creation will fail until you run: bun run install:kai',
    )
  }

  await seedWorkspace();
  runtime.pruneStaleEntries();
  await reconcileAgents();
  await reconcileRuntime();
  registerIpc();

  createWindow();
  if (mainWindow) setupAutoUpdater(mainWindow);

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

app.on('before-quit', async () => {
  log.info('Shutting down agent runtimes...');
  await runtime.shutdownAll();
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
