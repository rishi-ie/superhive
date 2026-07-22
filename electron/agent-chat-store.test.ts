/**
 * Tests for the chat persistence layer.
 *
 * Phase A scope (v2):
 *   1. Migration / data-shape — `migratePersistedRow` rewrites legacy
 *      rows (v1 `parts` or `content`) into v2 `ChatRow` shape.
 *   2. Path-explicit persistence — `append`, `appendBatch`, `readAll`,
 *      `trimTo`, `clear`, `chatFilePath` operate on whatever path the
 *      caller hands them.
 *   3. Legacy folder migration — `migrateLegacyChatFolders` relocates
 *      `~/.superhive/agents/<uuid>/chat.jsonl` into the agent's
 *      `localPath` folder.
 *
 * Run via `bun test electron/agent-chat-store.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { promises as fs, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  append,
  appendBatch,
  chatFilePath,
  clear,
  migrateLegacyChatFolders,
  migratePersistedRow,
  readAll,
  trimTo,
  type MigrationResult,
} from './agent-chat-store'

const tmp = join(tmpdir(), `chat-store-${Date.now()}-${Math.random().toString(36).slice(2)}`)
mkdirSync(tmp, { recursive: true })

const fakeAgentRow: { id: string; localPath?: string; name: string } = {
  id: '',
  name: 'fake',
}

let agentRows: Array<{ id: string; localPath?: string }> = []

mock.module('../src/storage/repositories/AgentRepository', () => ({
  AgentRepository: {
    getAll: async () => agentRows,
    getById: async (id: string) => agentRows.find((a) => a.id === id),
  },
}))

afterEach(() => {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })
  agentRows = []
})

beforeEach(() => {
  agentRows = []
})

// ---------------------------------------------------------------------------
// migratePersistedRow
// ---------------------------------------------------------------------------

describe('migratePersistedRow', () => {
  test('rewrites legacy user content: string into UserMessage', () => {
    const out = migratePersistedRow({
      id: 'm-1',
      role: 'user',
      content: 'Hello, world',
      ts: 1700000000,
    })
    expect(out).not.toBeNull()
    expect(out).toEqual({
      id: 'm-1',
      role: 'user',
      timestamp: 1700000000,
      text: 'Hello, world',
    })
  })

  test('passes through v2 user rows verbatim', () => {
    const out = migratePersistedRow({
      id: 'm-2',
      role: 'user',
      timestamp: 1,
      text: 'hi',
    })
    expect(out).toEqual({
      id: 'm-2',
      role: 'user',
      timestamp: 1,
      text: 'hi',
    })
  })

  test('migrates v1 assistant row with parts into AssistantMessage', () => {
    const out = migratePersistedRow({
      id: 'm-3',
      role: 'assistant',
      ts: 100,
      parts: [
        { type: 'thinking', text: 'plan', state: 'complete' },
        { type: 'tool-call', id: 't1', name: 'bash', args: {}, state: 'complete' },
        { type: 'text', text: 'reply', state: 'complete' },
      ],
      usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: 0.01 },
    })
    expect(out).not.toBeNull()
    expect(out?.role).toBe('assistant')
    expect(out?.timestamp).toBe(100)
    const a = out as { activityTimeline: unknown[]; response: unknown[]; metadata: { usage?: unknown } }
    expect(a.activityTimeline).toHaveLength(2) // thinking + tool-call
    expect(a.response).toHaveLength(1) // text
    expect(a.metadata.usage).toMatchObject({ cost: 0.01 })
  })

  test('passes through v2 assistant rows verbatim', () => {
    const out = migratePersistedRow({
      id: 'm-4',
      role: 'assistant',
      timestamp: 42,
      activityTimeline: [
        { kind: 'thinking', id: 't1', text: 'plan', state: 'complete', startedAt: 0, endedAt: 0 },
      ],
      response: [{ type: 'text', text: 'reply', state: 'complete' }],
      metadata: {},
    })
    expect(out).not.toBeNull()
    expect(out?.role).toBe('assistant')
    expect(out?.timestamp).toBe(42)
    const a = out as { activityTimeline: unknown[]; response: unknown[] }
    expect(a.activityTimeline).toHaveLength(1)
    expect(a.response).toHaveLength(1)
  })

  test('migrates legacy assistant content: string', () => {
    const out = migratePersistedRow({
      id: 'm-5',
      role: 'assistant',
      content: 'old answer',
      ts: 1,
    })
    expect(out).not.toBeNull()
    expect(out?.role).toBe('assistant')
    const a = out as { activityTimeline: unknown[]; response: unknown[] }
    expect(a.activityTimeline).toEqual([])
    expect(a.response).toEqual([
      { type: 'text', text: 'old answer', state: 'complete' },
    ])
  })

  test('preserves usage metadata when present', () => {
    const out = migratePersistedRow({
      id: 'm-6',
      role: 'assistant',
      content: 'OK',
      ts: 1,
      usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: 0.01 },
    })
    expect((out as { metadata: { usage?: { cost?: number } } } | null)?.metadata.usage?.cost).toBeCloseTo(0.01)
  })

  test('returns null when id is missing or input is not an object', () => {
    expect(migratePersistedRow(null)).toBeNull()
    expect(migratePersistedRow('garbage')).toBeNull()
    expect(migratePersistedRow({})).toBeNull()
  })

  test('returns null when role is missing or invalid', () => {
    expect(migratePersistedRow({ id: 'x', ts: 1 })).toBeNull()
    expect(migratePersistedRow({ id: 'x', role: 'system', ts: 1 })).toBeNull()
  })

  test('returns null for user row without text and without content', () => {
    expect(migratePersistedRow({ id: 'm', role: 'user', ts: 1 })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// chatFilePath
// ---------------------------------------------------------------------------

describe('chatFilePath', () => {
  test('joins agentDir with chat.jsonl', () => {
    expect(chatFilePath('/tmp/agent-foo')).toBe('/tmp/agent-foo/chat.jsonl')
    expect(chatFilePath('/Users/x/.superhive/agents/my-agent')).toBe(
      '/Users/x/.superhive/agents/my-agent/chat.jsonl',
    )
  })
})

// ---------------------------------------------------------------------------
// append / appendBatch / readAll / trimTo / clear (path-explicit)
// ---------------------------------------------------------------------------

describe('path-explicit persistence', () => {
  test('append + readAll round-trip a user message', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    const msg = {
      id: 'm-1',
      role: 'user' as const,
      timestamp: 1,
      text: 'hi',
    }
    await append(chatPath, msg)
    const got = await readAll(chatPath)
    expect(got).toEqual([msg])
  })

  test('appendBatch merges by id (no duplicates on re-flush)', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    const m1 = {
      id: 'm-1',
      role: 'user' as const,
      timestamp: 1,
      text: 'hi',
    }
    await appendBatch(chatPath, [m1])
    await appendBatch(chatPath, [m1])
    const got = await readAll(chatPath)
    expect(got).toHaveLength(1)
    expect(got[0]?.id).toBe('m-1')
  })

  test('appendBatch handles legacy v1 user content: string rows on disk', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    await fs.writeFile(chatPath, JSON.stringify({ id: 'm-1', role: 'user', content: 'old', ts: 1 }) + '\n')
    const m2 = {
      id: 'm-2',
      role: 'user' as const,
      timestamp: 2,
      text: 'new',
    }
    await appendBatch(chatPath, [m2])
    const got = await readAll(chatPath)
    expect(got.map((m) => m.id).sort()).toEqual(['m-1', 'm-2'])
    expect(got.find((m) => m.id === 'm-1')).toEqual({
      id: 'm-1',
      role: 'user',
      timestamp: 1,
      text: 'old',
    })
  })

  test('appendBatch handles legacy v1 assistant parts:[] rows on disk', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    await fs.writeFile(
      chatPath,
      JSON.stringify({
        id: 'm-1',
        role: 'assistant',
        ts: 1,
        parts: [{ type: 'text', text: 'hi', state: 'complete' }],
      }) + '\n',
    )
    const m2 = {
      id: 'm-2',
      role: 'assistant' as const,
      timestamp: 2,
      activityTimeline: [],
      response: [{ type: 'text' as const, text: 'new', state: 'complete' as const }],
      metadata: {},
    }
    await appendBatch(chatPath, [m2])
    const got = await readAll(chatPath)
    expect(got.map((m) => m.id).sort()).toEqual(['m-1', 'm-2'])
    const m1 = got.find((m) => m.id === 'm-1') as {
      role: string
      response: Array<{ type: string; text: string }>
    }
    expect(m1.role).toBe('assistant')
    expect(m1.response[0]?.text).toBe('hi')
  })

  test('trimTo keeps the last N messages', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    const msgs = Array.from({ length: 5 }, (_, i) => ({
      id: `m-${i}`,
      role: 'user' as const,
      timestamp: i,
      text: `t${i}`,
    }))
    await appendBatch(chatPath, msgs)
    await trimTo(chatPath, 2)
    const got = await readAll(chatPath)
    expect(got.map((m) => m.id)).toEqual(['m-3', 'm-4'])
  })

  test('clear empties the file', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    await append(chatPath, {
      id: 'm-1',
      role: 'user',
      timestamp: 1,
      text: 'hi',
    })
    await clear(chatPath)
    const got = await readAll(chatPath)
    expect(got).toEqual([])
  })

  test('readAll returns [] when file does not exist', async () => {
    const got = await readAll(join(tmp, 'nope', 'chat.jsonl'))
    expect(got).toEqual([])
  })

  test('path-explicit functions do not create UUID folders anywhere', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    await append(chatPath, {
      id: 'm-1',
      role: 'user',
      timestamp: 1,
      text: 'hi',
    })
    expect(existsSync(chatPath)).toBe(true)
    expect(existsSync(tmp)).toBe(true)
    const siblings = (await fs.readdir(tmp)).filter((n) =>
      /^[0-9a-f-]{36}$/.test(n),
    )
    expect(siblings).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// migrateLegacyChatFolders
// ---------------------------------------------------------------------------

describe('migrateLegacyChatFolders', () => {
  const UUID = '11111111-2222-4333-8444-555555555555'

  test('moves chat.jsonl out of the legacy UUID folder into the agent localPath', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    const legacyChat = join(uuidDir, 'chat.jsonl')
    await fs.writeFile(
      legacyChat,
      JSON.stringify({ id: 'm-1', role: 'user', content: 'old chat', ts: 1 }) + '\n',
    )

    const agentDir = join(tmp, 'agent-named')
    mkdirSync(agentDir, { recursive: true })

    agentRows = [{ id: UUID, localPath: agentDir }]

    const result: MigrationResult = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toEqual([{ agentId: UUID, from: uuidDir, to: chatFilePath(agentDir) }])
    expect(result.unresolved).toEqual([])

    expect(existsSync(uuidDir)).toBe(false)
    expect(existsSync(legacyChat)).toBe(false)
    expect(existsSync(chatFilePath(agentDir))).toBe(true)

    const migrated = await readAll(chatFilePath(agentDir))
    expect(migrated).toHaveLength(1)
    expect(migrated[0]).toEqual({
      id: 'm-1',
      role: 'user',
      timestamp: 1,
      text: 'old chat',
    })
  })

  test('removes empty UUID folders whose agent row points to a real folder', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })

    const agentDir = join(tmp, 'agent-named')
    mkdirSync(agentDir, { recursive: true })
    agentRows = [{ id: UUID, localPath: agentDir }]

    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toEqual([])
    expect(result.evicted).toEqual([uuidDir])
    expect(existsSync(uuidDir)).toBe(false)
  })

  test('reports unresolved for UUID folders with no matching agent row', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    await fs.writeFile(uuidDir + '/chat.jsonl', '')

    agentRows = []
    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toEqual([])
    expect(result.unresolved).toEqual([uuidDir])
    expect(existsSync(uuidDir)).toBe(true)
    expect(existsSync(uuidDir + '/chat.jsonl')).toBe(true)
  })

  test('drops orphan chat.jsonl when agent folder is gone', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    const legacyChat = join(uuidDir, 'chat.jsonl')
    await fs.writeFile(legacyChat, 'orphan\n')

    agentRows = [{ id: UUID, localPath: join(tmp, 'agent-gone') }]

    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.evicted).toContain(uuidDir)
    expect(result.moved).toEqual([])
    expect(existsSync(uuidDir)).toBe(false)
    expect(existsSync(legacyChat)).toBe(false)
  })

  test('is idempotent — running twice is a no-op the second time', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    await fs.writeFile(uuidDir + '/chat.jsonl', 'first\n')

    const agentDir = join(tmp, 'agent-named')
    mkdirSync(agentDir, { recursive: true })
    agentRows = [{ id: UUID, localPath: agentDir }]

    const first = await migrateLegacyChatFolders(agentsRoot)
    expect(first.moved).toHaveLength(1)

    const second = await migrateLegacyChatFolders(agentsRoot)
    expect(second.moved).toEqual([])
    expect(second.evicted).toEqual([])
    expect(second.unresolved).toEqual([])
  })

  test('prefers newer target file when both legacy and new exist', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    const legacyChat = join(uuidDir, 'chat.jsonl')
    await fs.writeFile(
      legacyChat,
      JSON.stringify({ id: 'old', role: 'user', content: 'legacy', ts: 1 }) + '\n',
    )

    const agentDir = join(tmp, 'agent-named')
    mkdirSync(agentDir, { recursive: true })
    const targetPath = chatFilePath(agentDir)
    await fs.writeFile(
      targetPath,
      JSON.stringify({ id: 'new', role: 'user', content: 'fresh', ts: 2 }) + '\n',
    )

    agentRows = [{ id: UUID, localPath: agentDir }]

    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toHaveLength(1)
    expect(existsSync(legacyChat)).toBe(false)
    expect(existsSync(targetPath)).toBe(true)
    const final = await readAll(targetPath)
    expect(final.map((m) => m.id)).toEqual(['new'])
  })

  test('ignores non-UUID folders (real agent folders) without touching them', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const realAgentDir = join(agentsRoot, 'my-cool-agent')
    mkdirSync(realAgentDir, { recursive: true })
    await fs.writeFile(realAgentDir + '/chat.jsonl', '')

    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toEqual([])
    expect(existsSync(realAgentDir)).toBe(true)
    expect(existsSync(realAgentDir + '/chat.jsonl')).toBe(true)
  })

  test('returns empty result when agents root does not exist', async () => {
    const result = await migrateLegacyChatFolders(join(tmp, 'no-such-root'))
    expect(result).toEqual({ moved: [], evicted: [], unresolved: [] })
  })
})

void fakeAgentRow
