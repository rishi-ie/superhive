import { expect, test } from 'bun:test'
import { activeComposerTrigger } from './ProjectChatComposer'
import { nextEnabledIndex, resolveComposerCommands } from './composer-commands'

test('recognizes slash and at queries at the active cursor', () => {
  expect(activeComposerTrigger('/doc', 4)).toMatchObject({ kind: '/', query: 'doc', start: 0 })
  expect(activeComposerTrigger('Review @pdf now', 11)).toMatchObject({ kind: '@', query: 'pdf', start: 7 })
  expect(activeComposerTrigger('Review @pdf now', 15)).toBeNull()
})

test('wraps keyboard selection around disabled command entries', () => {
  const commands = [
    { id: 'first', label: 'First', keywords: [], action: 'mode' as const, disabled: true },
    { id: 'second', label: 'Second', keywords: [], action: 'mode' as const },
    { id: 'third', label: 'Third', keywords: [], action: 'mode' as const },
  ]
  expect(nextEnabledIndex(commands, 1, 1)).toBe(2)
  expect(nextEnabledIndex(commands, 2, 1)).toBe(1)
  expect(nextEnabledIndex(commands, 1, -1)).toBe(2)
})

test('keeps unavailable manually configured plugins visible but disabled', () => {
  const commands = resolveComposerCommands({ version: 1, items: [
    { id: 'manual-plugin', label: 'Manual plugin', action: 'plugin', value: 'missing-plugin' },
  ] }, { skills: [], plugins: [], activeSkills: [], activePlugins: [] })
  expect(commands[0]).toMatchObject({ disabled: true, disabledReason: 'Not installed for this agent' })
})

test('keeps / skill-only and @ plugin/MCP-only when resolving marketplace capabilities', () => {
  const capabilities = [
    { id: 'brief', kind: 'skill' as const, version: '1.0.0', label: 'Brief', description: '', category: 'Featured', permissions: [], source: { path: 'packages/brief', entry: 'SKILL.md', integrity: 'sha256-test' }, activation: 'restart-required' as const, installed: { id: 'brief', version: '1.0.0', installedAt: '', integrity: 'sha256-test', status: 'installed' as const } },
    { id: 'mcp', kind: 'mcp-adapter' as const, version: '1.0.0', label: 'MCP', description: '', category: 'Featured', permissions: [], source: { path: 'packages/mcp', entry: 'index.ts', integrity: 'sha256-test' }, activation: 'restart-required' as const },
  ]
  const slash = resolveComposerCommands({ version: 1, items: [{ id: 'skills', source: 'skills' }] }, { capabilities })
  const at = resolveComposerCommands({ version: 1, items: [{ id: 'plugins', source: 'plugins' }] }, { capabilities })
  expect(slash).toHaveLength(1)
  expect(slash[0]).toMatchObject({ action: 'skill', value: 'brief' })
  expect(slash[0]?.disabled).toBeUndefined()
  expect(at).toHaveLength(1)
  expect(at[0]).toMatchObject({ action: 'plugin', value: 'mcp', disabled: true, disabledReason: 'Install from Marketplace first' })
})
