/**
 * Agent PTY host — runs in Electron main process.
 *
 * Manages a Map of ulid → node-pty IPty instances.
 * Bridges PTY output/input over IPC so the renderer can drive a xterm.js instance
 * for each active agent terminal.
 *
 * Architecture:
 *   electron/main.ts imports this module and forwards IPC messages to it.
 *   Preload script exposes a typed window.electron.pty API to the renderer.
 *   Renderer sends user keystrokes → preload → main → node-pty.
 *   PTY output → main → renderer (via window.electron.pty.onData callback).
 */
import * as pty from 'node-pty';
import log from 'electron-log/main';
import { BrowserWindow } from 'electron';

export type PtyId = string;

interface PtyEntry {
  pty: pty.IPty;
  onDataCallbacks: Set<(data: string) => void>;
}

const processes = new Map<PtyId, PtyEntry>();

function broadcastToRenderer(channel: string, payload: Record<string, unknown>): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue;
    try {
      win.webContents.send(channel, payload);
    } catch (err) {
      log.warn(`agent-host: failed to send to renderer: ${err}`);
    }
  }
}

export function spawnPty(id: PtyId, agentPath: string, cols = 80, rows = 24): { ok: true } | { ok: false; error: string } {
  if (processes.has(id)) {
    return { ok: false, error: `PTY already running for ${id}` };
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const shellArgs: string[] = [];

  log.info(`agent-host: spawning PTY for ${id} with agent path: ${agentPath}`);

  let ptyProcess: pty.IPty;
  try {
    ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-color',
      cols,
      rows,
      cwd: agentPath,
      env: {
        ...process.env,
        AGENT_ID: id,
        TERM: 'xterm-256color',
      } as Record<string, string>,
    });
  } catch (err) {
    log.error(`agent-host: failed to spawn PTY for ${id}:`, err);
    return { ok: false, error: String(err) };
  }

  ptyProcess.onData((data: string) => {
    broadcastToRenderer(`pty:data:${id}`, { data });
  });

  ptyProcess.onExit(({ exitCode }) => {
    log.info(`agent-host: PTY for ${id} exited with code ${exitCode}`);
    processes.delete(id);
    broadcastToRenderer(`pty:exit:${id}`, { exitCode });
  });

  processes.set(id, { pty: ptyProcess, onDataCallbacks: new Set() });

  // Write a welcome banner once the shell is ready. The banner auto-runs
  // ./agent.sh if it exists in the cwd, otherwise gives a hint.
  const banner =
    process.platform === 'win32'
      ? `Write-Host "Pi agent shell - $PWD"\r\n`
      : `printf '\\033[1;36mPi agent shell\\033[0m — %s\\n' "$(pwd)"; ` +
        `if [ -x ./agent.sh ]; then printf '\\033[1;32m→ Found agent.sh, starting…\\033[0m\\n'; ./agent.sh; ` +
        `elif [ -f ./agent.sh ]; then printf '\\033[1;33m→ Found agent.sh but not executable — run: chmod +x ./agent.sh\\033[0m\\n'; ` +
        `else printf '\\033[1;33m→ No agent.sh in %s. Add one and run ./agent.sh.\\033[0m\\n' "$(pwd)"; fi\r`;

  setTimeout(() => {
    try {
      ptyProcess.write(banner);
    } catch (err) {
      log.warn(`agent-host: failed to write banner for ${id}:`, err);
    }
  }, 80);

  return { ok: true };
}

export function writePty(id: PtyId, data: string): boolean {
  const entry = processes.get(id);
  if (!entry) return false;
  try {
    entry.pty.write(data);
    return true;
  } catch (err) {
    log.warn(`agent-host: writePty failed for ${id}:`, err);
    return false;
  }
}

export function resizePty(id: PtyId, cols: number, rows: number): boolean {
  const entry = processes.get(id);
  if (!entry) return false;
  try {
    entry.pty.resize(Math.max(1, cols), Math.max(1, rows));
    return true;
  } catch (err) {
    log.warn(`agent-host: resizePty failed for ${id}:`, err);
    return false;
  }
}

export function killPty(id: PtyId): boolean {
  const entry = processes.get(id);
  if (!entry) return false;
  try {
    entry.pty.kill();
    processes.delete(id);
    return true;
  } catch (err) {
    log.warn(`agent-host: killPty failed for ${id}:`, err);
    return false;
  }
}

export function listPtyIds(): PtyId[] {
  return Array.from(processes.keys());
}
