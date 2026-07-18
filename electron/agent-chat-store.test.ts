/**
 * Tests for the chat persistence layer.
 *
 * Covers:
 *   1. Migration / data-shape — `migratePersistedMessage` rewrites legacy
 *      `content: string` rows to `parts: ContentPart[]` and self-heals
 *      stale streaming state.
 *   2. Path-explicit persistence — `append`, `appendBatch`, `readAll`,
 *      `trimTo`, `clear`, `chatFilePath` operate on whatever path the
 *      caller hands them. They do NOT touch `~/.superhive/agents/<uuid>/`
 *      implicitly.
 *   3. Legacy folder migration — `migrateLegacyChatFolders` relocates
 *      `~/.superhive/agents/<uuid>/chat.jsonl` into the agent's
 *      `localPath` folder, removes empty UUID folders, and is idempotent.
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
  migratePersistedMessage,
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

// Mock the AgentRepository used by migrateLegacyChatFolders so we can
// control which agents the migration sees without booting Electron.
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
// migratePersistedMessage
// ---------------------------------------------------------------------------

describe('migratePersistedMessage', () => {
  test('rewrites legacy content: string into parts: [{type:"text"}]', () => {
    const out = migratePersistedMessage({
      id: 'm-1',
      role: 'user',
      content: 'Hello, world',
      ts: 1700000000,
    })
    expect(out).not.toBeNull()
    expect(out?.role).toBe('user')
    expect(out?.parts).toHaveLength(1)
    expect(out?.parts[0]).toEqual({ type: 'text', text: 'Hello, world', state: 'complete' })
  })

  test('passes through already-migrated rows', () => {
    const out = migratePersistedMessage({
      id: 'm-2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'hi', state: 'complete' },
        { type: 'thinking', text: 'plan', state: 'complete' },
      ],
      ts: 42,
    })
    expect(out?.parts).toHaveLength(2)
    expect(out?.ts).toBe(42)
  })

  test('preserves usage metadata when present', () => {
    const out = migratePersistedMessage({
      id: 'm-3',
      role: 'assistant',
      content: 'OK',
      ts: 1,
      usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: 0.01 },
    })
    expect(out?.usage?.cost).toBeCloseTo(0.01)
  })

  test('returns null when id is missing or input is not an object', () => {
    expect(migratePersistedMessage(null)).toBeNull()
    expect(migratePersistedMessage('garbage')).toBeNull()
    expect(migratePersistedMessage({})).toBeNull()
  })

  test('self-heals streaming state on disk to complete', () => {
    const out = migratePersistedMessage({
      id: 'm-4',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'partial', state: 'streaming' },
        { type: 'thinking', text: 'mid', state: 'streaming' },
        { type: 'tool-call', id: 't1', name: 'bash', args: {}, state: 'pending' },
      ],
      ts: 5,
    })
    // Only the parts that have a `state` field are normalized. Image and
    // compaction-summary parts are stateless and pass through unchanged.
    for (const p of out?.parts ?? []) {
      if ('state' in p) expect(p.state).toBe('complete')
    }
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
  test('append + readAll round-trip a message', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    const msg = {
      id: 'm-1',
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: 'hi', state: 'complete' as const }],
      ts: 1,
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
      parts: [{ type: 'text' as const, text: 'hi', state: 'complete' as const }],
      ts: 1,
    }
    await appendBatch(chatPath, [m1])
    // Re-flushing the same message must not append a duplicate line.
    await appendBatch(chatPath, [m1])
    const got = await readAll(chatPath)
    expect(got).toHaveLength(1)
    expect(got[0]?.id).toBe('m-1')
  })

  test('appendBatch handles legacy content: string rows on disk', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    // Write a legacy row directly.
    await fs.writeFile(chatPath, JSON.stringify({ id: 'm-1', role: 'user', content: 'old', ts: 1 }) + '\n')
    const m2 = {
      id: 'm-2',
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text: 'new', state: 'complete' as const }],
      ts: 2,
    }
    await appendBatch(chatPath, [m2])
    const got = await readAll(chatPath)
    expect(got.map((m) => m.id).sort()).toEqual(['m-1', 'm-2'])
    // Legacy row was migrated to parts.
    expect(got[0]?.parts[0]).toEqual({ type: 'text', text: 'old', state: 'complete' })
  })

  test('trimTo keeps the last N messages', async () => {
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    const msgs = Array.from({ length: 5 }, (_, i) => ({
      id: `m-${i}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: `t${i}`, state: 'complete' as const }],
      ts: i,
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
      parts: [{ type: 'text', text: 'hi', state: 'complete' }],
      ts: 1,
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
    // Smoke test: persistence operates purely on the path passed in, no
    // implicit directory creation in ~/.superhive/agents/<uuid>/.
    const agentDir = join(tmp, 'agent-foo')
    mkdirSync(agentDir, { recursive: true })
    const chatPath = chatFilePath(agentDir)
    await append(chatPath, {
      id: 'm-1',
      role: 'user',
      parts: [{ type: 'text', text: 'hi', state: 'complete' }],
      ts: 1,
    })
    // The only file that should exist is the one we wrote to.
    expect(existsSync(chatPath)).toBe(true)
    expect(existsSync(tmp)).toBe(true)
    // No UUID-named siblings.
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
    // Set up: legacy folder + matching agent row whose localPath exists.
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

    // Legacy folder is gone; chat.jsonl lives inside the agent folder.
    expect(existsSync(uuidDir)).toBe(false)
    expect(existsSync(legacyChat)).toBe(false)
    expect(existsSync(chatFilePath(agentDir))).toBe(true)

    // Content survived the move.
    const migrated = await readAll(chatFilePath(agentDir))
    expect(migrated).toHaveLength(1)
    expect(migrated[0]?.parts[0]).toEqual({ type: 'text', text: 'old chat', state: 'complete' })
  })

  test('removes empty UUID folders whose agent row points to a real folder', async () => {
    const agentsRoot = join(tmp, 'agents-root')
    mkdirSync(agentsRoot, { recursive: true })
    const uuidDir = join(agentsRoot, UUID)
    mkdirSync(uuidDir, { recursive: true })
    // No chat.jsonl inside — just an empty leftover folder.

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

    // agentRows empty — no DB row matches.
    const result = await migrateLegacyChatFolders(agentsRoot)
    expect(result.moved).toEqual([])
    expect(result.unresolved).toEqual([uuidDir])
    // Untouched.
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

    // Agent row points to a path that doesn't exist on disk.
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
    // Legacy file is gone; the newer target wins.
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

void fakeAgentRow // satisfies ts-prune
