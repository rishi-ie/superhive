import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import { ipcMain } from 'electron'
import log from 'electron-log/main'

const execFileP = promisify(execFile)

export const TEMPLATE_PATH = join(homedir(), '.superhive', 'manifest-pi-template')
const TEMPLATE_URL = 'https://github.com/rishi-ie/manifest-pi.git'
const CLONE_TIMEOUT_MS = 180_000

export function getTemplatePath(): string {
  return TEMPLATE_PATH
}

async function isValidClone(): Promise<boolean> {
  return existsSync(join(TEMPLATE_PATH, 'agent.sh'))
}

export function registerManifestPiIpc(): void {
  ipcMain.handle('manifest-pi:ensureTemplate', async () => {
    if (await isValidClone()) {
      return { ok: true as const, path: TEMPLATE_PATH, cloned: false }
    }

    try {
      await mkdir(join(homedir(), '.superhive'), { recursive: true })
      log.info(`[manifest-pi] cloning template to ${TEMPLATE_PATH}`)
      await execFileP('git', ['clone', TEMPLATE_URL, TEMPLATE_PATH], {
        timeout: CLONE_TIMEOUT_MS,
      })

      if (!(await isValidClone())) {
        return {
          ok: false as const,
          path: TEMPLATE_PATH,
          error: 'Clone finished but agent.sh is missing in the result.',
        }
      }

      return { ok: true as const, path: TEMPLATE_PATH, cloned: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      log.error(`[manifest-pi] clone failed:`, error)
      return { ok: false as const, path: TEMPLATE_PATH, error }
    }
  })

  ipcMain.handle('manifest-pi:checkTemplate', async () => {
    return { ok: await isValidClone(), path: TEMPLATE_PATH }
  })
}