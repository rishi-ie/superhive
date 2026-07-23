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
import { reconcileProjects } from './reconcile-projects';
import { reconcileRuntime } from './reconcile-runtime';
import { migrateLegacyChatFolders } from './agent-chat-store';
import { isGeneralKaiReady } from './install-general-kai';
import { installDefaultsBundle } from './install-defaults-bundle';
import { agentsFsWatcher } from './agents-fs-watcher';
import { attachMailboxWatches } from './ipc/mailbox';
import { tasksFileWatcher } from './tasks-file-watcher';
import { getTaskRunner } from './task-runner';

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

  installDefaultsBundle()

  await seedWorkspace();
  runtime.pruneStaleEntries();
  await reconcileAgents();
  // Project reconcile runs after agent reconcile so coordinator agent
  // rows are already canonical (manifest stamped, localPath set). Any
  // folder adopted as a project here will be correctly linked to its
  // coordinator agent in the same boot cycle.
  const projectReport = await reconcileProjects();
  // After reconcile adopts any orphans and evicts missing folders, the DB
  // agent rows carry the canonical localPath. Use that to relocate any
  // legacy chat logs from `~/.superhive/agents/<uuid>/` into the agent's
  // own folder, so a single agent = one folder on disk.
  await migrateLegacyChatFolders();
  await reconcileRuntime();
  registerIpc();

  // After IPC is wired, start the fs watcher. It will keep db.agents.json
  // in sync with the filesystem for the lifetime of the process. The boot
  // reconcile above already evicted any rows whose folders are gone, so a
  // notification here pushes the just-loaded renderer to re-fetch the
  // (now-canonical) list.
  agentsFsWatcher.start();
  agentsFsWatcher.notifyChanged();
  // Gap 2: wire the mailbox watcher's onCoordMail + onMemberMail hooks
  // to runtime.send() wake prompts, and start the watcher.
  attachMailboxWatches();
  // Gap 3: start the tasks file watcher (ingests plan/complete
  // drops from the coordinator) and the task runner (5s poll loop
  // that dispatches ready tasks to their assigned workers).
  tasksFileWatcher.start();
  getTaskRunner().start();
  // If the boot reconcile dropped projects whose folders were missing,
  // the renderer needs to know before the user navigates to the projects
  // page. Surface the deletions so the toast can render, and push a
  // generic projects:changed so the sidebar/table re-fetch any adopted
  // projects too.
  if (projectReport.removed.length > 0) {
    agentsFsWatcher.notifyProjectsRemoved(projectReport.removed);
  }
  if (projectReport.adopted.length > 0) {
    agentsFsWatcher.notifyProjectsChanged();
  }

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
  agentsFsWatcher.stop();
  tasksFileWatcher.stop();
  getTaskRunner().stop();
  await runtime.shutdownAll();
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
