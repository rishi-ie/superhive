import type { ComposerCommandAction, ComposerCommandFile, ComposerCommandItem } from '@/models/composer-command'
import type { MarketplaceItem } from '@/models/marketplace'

export interface CommandCatalogItem { path: string; manifest?: { title?: string; description?: string } }
export interface ResolvedComposerCommand {
  id: string
  label: string
  description?: string
  keywords: string[]
  action: ComposerCommandAction
  value?: string
  disabled?: boolean
  disabledReason?: string
  capability?: MarketplaceItem
}

export type ComposerCommandGroupId = 'add' | 'skills' | 'plugins'

export interface ComposerCommandGroup {
  id: ComposerCommandGroupId
  label: string
  commands: ResolvedComposerCommand[]
}

type Catalogs = { skills?: CommandCatalogItem[]; plugins?: CommandCatalogItem[]; activeSkills?: string[]; activePlugins?: string[]; capabilities?: MarketplaceItem[] }

function labelFor(path: string): string { return path.split('/').pop() || path }

function availability(action: 'skill' | 'plugin', value: string, catalogs: Catalogs): Pick<ResolvedComposerCommand, 'disabled' | 'disabledReason'> {
  const catalog = action === 'skill' ? catalogs.skills ?? [] : catalogs.plugins ?? []
  const active = action === 'skill' ? catalogs.activeSkills ?? [] : catalogs.activePlugins ?? []
  if (!catalog.some((item) => item.path === value)) return { disabled: true, disabledReason: 'Not installed for this agent' }
  if (!active.includes(value)) return { disabled: true, disabledReason: 'Enable it in Manage first' }
  return {}
}

function fromItem(item: ComposerCommandItem, catalogs: Catalogs): ResolvedComposerCommand[] {
  if (item.source === 'skills' || item.source === 'plugins') {
    const action = item.source === 'skills' ? 'skill' : 'plugin'
    const marketplace = (catalogs.capabilities ?? []).filter((entry) => action === 'skill' ? entry.kind === 'skill' : entry.kind !== 'skill')
    if (catalogs.capabilities) return marketplace.map((entry) => ({
      id: `${item.id}:${entry.id}`,
      label: entry.label,
      description: entry.description,
      keywords: [entry.id, entry.kind], action, value: entry.id, capability: entry,
      ...(entry.installed ? {} : { disabled: true, disabledReason: 'Install from Marketplace first' }),
    }))
    const catalog = action === 'skill' ? catalogs.skills ?? [] : catalogs.plugins ?? []
    return catalog.map((entry) => ({
      id: `${item.id}:${entry.path}`,
      label: entry.manifest?.title ?? labelFor(entry.path),
      description: entry.manifest?.description ?? entry.path,
      keywords: [entry.path], action, value: entry.path,
      ...availability(action, entry.path, catalogs),
    }))
  }
  if (!item.action || !item.label) return []
  const entry: ResolvedComposerCommand = {
    id: item.id, label: item.label, description: item.description, keywords: item.keywords ?? [], action: item.action, value: item.value,
  }
  return item.action === 'skill' || item.action === 'plugin'
    ? [{ ...entry, ...availability(item.action, item.value ?? '', catalogs) }]
    : [entry]
}

export function resolveComposerCommands(file: ComposerCommandFile, catalogs: Catalogs): ResolvedComposerCommand[] {
  return file.items.flatMap((item) => fromItem(item, catalogs))
}

export function filterComposerCommands(items: ResolvedComposerCommand[], query: string): ResolvedComposerCommand[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter((item) => [item.id, item.label, item.description ?? '', ...item.keywords].some((value) => value.toLowerCase().includes(needle)))
}

export function groupComposerCommands(items: ResolvedComposerCommand[]): ComposerCommandGroup[] {
  const groups: ComposerCommandGroup[] = [
    { id: 'add', label: 'Add', commands: [] },
    { id: 'skills', label: 'Skills', commands: [] },
    { id: 'plugins', label: 'Plugins', commands: [] },
  ]

  for (const item of items) {
    const group = item.action === 'skill' ? groups[1] : item.action === 'plugin' ? groups[2] : groups[0]
    group?.commands.push(item)
  }

  return groups.filter((group) => group.commands.length > 0)
}

export function nextEnabledIndex(items: ResolvedComposerCommand[], from: number, direction: 1 | -1): number {
  if (!items.some((item) => !item.disabled)) return -1
  const start = from < 0 ? (direction === 1 ? -1 : 0) : from
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (start + direction * offset + items.length) % items.length
    if (!items[index]?.disabled) return index
  }
  return -1
}
