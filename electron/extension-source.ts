import { app } from 'electron'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname_bundled = dirname(fileURLToPath(import.meta.url))

export const BUNDLED_EXTENSION_NAME = 'superhive-pi-truth'

export function getBundledExtensionPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'extensions', BUNDLED_EXTENSION_NAME)
  }
  return resolve(__dirname_bundled, '..', 'extensions', BUNDLED_EXTENSION_NAME)
}

export function hasBundledExtension(): boolean {
  return existsSync(join(getBundledExtensionPath(), 'index.ts'))
}
