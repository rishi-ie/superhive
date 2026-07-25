import { copyFileSync, existsSync, mkdirSync, readFileSync, watch, type FSWatcher } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import log from 'electron-log/main'
import type { ComposerCommandAction, ComposerCommandFile, ComposerCommandFiles, ComposerCommandItem, ComposerCommandMenu } from '../src/models/composer-command'

const COMMANDS_DIR = join(homedir(), '.superhive', 'composer-commands')
const FILES: Record<ComposerCommandMenu, string> = { slash: 'slash.json', at: 'at.json' }
const ACTIONS = new Set<ComposerCommandAction>(['skill', 'plugin', 'mode', 'goal', 'attachment'])
let cached: ComposerCommandFiles | null = null
let watcher: FSWatcher | null = null

function sourceDir(): string {
  const candidates = [
    process.resourcesPath && join(process.resourcesPath, 'composer-commands'),
    process.env.SUPERHIVE_RESOURCES_PATH && join(process.env.SUPERHIVE_RESOURCES_PATH, 'composer-commands'),
    join(process.cwd(), 'resources', 'composer-commands'),
  ].filter((path): path is string => Boolean(path))
  const found = candidates.find(existsSync)
  if (!found) throw new Error('composer command defaults not found')
  return found
}

function isItem(value: unknown): value is ComposerCommandItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || !item.id.trim()) return false
  if (item.source === 'skills' || item.source === 'plugins') return true
  return typeof item.label === 'string' && typeof item.action === 'string' && ACTIONS.has(item.action as ComposerCommandAction)
}

function readFile(menu: ComposerCommandMenu): ComposerCommandFile | null {
  try {
    const parsed = JSON.parse(readFileSync(join(COMMANDS_DIR, FILES[menu]), 'utf8')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const config = parsed as Record<string, unknown>
    if (config.version !== 1 || !Array.isArray(config.items) || !config.items.every(isItem)) return null
    return { version: 1, items: config.items }
  } catch {
    return null
  }
}

export function installComposerCommands(): void {
  mkdirSync(COMMANDS_DIR, { recursive: true })
  const defaults = sourceDir()
  for (const menu of Object.keys(FILES) as ComposerCommandMenu[]) {
    const destination = join(COMMANDS_DIR, FILES[menu])
    if (!existsSync(destination)) copyFileSync(join(defaults, FILES[menu]), destination)
  }
}

export function getComposerCommands(): ComposerCommandFiles {
  installComposerCommands()
  const next = { slash: readFile('slash'), at: readFile('at') }
  if (next.slash && next.at) {
    cached = { slash: next.slash, at: next.at }
    return cached
  }
  if (cached) {
    log.warn('[composer-commands] invalid JSON; retaining the last valid configuration')
    return cached
  }
  throw new Error('composer command configuration is invalid')
}

export function watchComposerCommands(onChange: () => void): void {
  getComposerCommands()
  if (watcher) return
  watcher = watch(COMMANDS_DIR, (_event, name) => {
    if (!name || !Object.values(FILES).includes(String(name))) return
    try {
      getComposerCommands()
      onChange()
    } catch (error) {
      log.warn('[composer-commands] ignored invalid update:', error)
    }
  })
}
