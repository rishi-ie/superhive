import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { readdirSync, existsSync, renameSync } from 'node:fs'
import { homedir } from 'node:os'
import { queueWrite } from '../src/storage/queue-write'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import type { ContentPart, RuntimeMessage } from '../src/models/runtime'

/**
 * Chat-history persistence lives inside the agent's own folder at
 * `chat.jsonl`. The caller resolves the absolute path and passes it to every
 * function here — this module never touches `~/.superhive/agents/` directly
 * (except for the one-time legacy migration in `migrateLegacyChatFolders`).
 *
 * Why path-explicit:
 *   - One folder per agent on disk. No more UUID-named siblings next to the
 *     agent's named folder.
 *   - The chat log travels with the agent folder if a user moves/renames it.
 *   - `agents:delete` already removes `agent.localPath`, which now removes
 *     the chat log too — no orphan UUID folders left behind.
 *   - The hot path doesn't hit `AgentRepository` for a DB lookup per flush.
 *
 * Pre-refactor: this file keyed everything off `agentId` and wrote to
 * `~/.superhive/agents/<uuid>/chat.jsonl`. The legacy migration
 * (`migrateLegacyChatFolders`) relocates those files into their agent's
 * `localPath` so existing users keep their history.
 */

export const AGENTS_ROOT = join(homedir(), '.superhive', 'agents')

export function chatFilePath(agentDir: string): string {
  return join(agentDir, 'chat.jsonl')
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true })
}

export async function append(chatPath: string, message: RuntimeMessage): Promise<void> {
  await ensureDir(chatPath)
  await queueWrite(chatPath, async () => {
    await fs.appendFile(chatPath, JSON.stringify(message) + '\n', 'utf8')
  })
}

export async function appendBatch(chatPath: string, messages: RuntimeMessage[]): Promise<void> {
  if (messages.length === 0) return
  const normalized = messages.map((m) => migratePersistedMessage(m) ?? m)
  await ensureDir(chatPath)
  // Merge with existing file: replace any entry with the same id, append new.
  // Without this, message-end re-flushing the same message (after the fix that
  // re-arms persist on message-end) would append a duplicate line for that
  // id, causing the same message to appear twice in chat.jsonl.
  await queueWrite(chatPath, async () => {
    const existing: RuntimeMessage[] = []
    try {
      const raw = await fs.readFile(chatPath, 'utf8')
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        try {
          const m = migratePersistedMessage(JSON.parse(line))
          if (m) existing.push(m)
        } catch {
          // Corrupt line — skip
        }
      }
    } catch {
      // File doesn't exist yet
    }
    const byId = new Map<string, RuntimeMessage>()
    for (const m of existing) byId.set(m.id, m)
    for (const m of normalized) byId.set(m.id, m)
    const merged = Array.from(byId.values())
    const body =
      merged.length === 0 ? '' : merged.map((m) => JSON.stringify(m)).join('\n') + '\n'
    await fs.writeFile(chatPath, body, 'utf8')
  })
}

export async function readAll(chatPath: string): Promise<RuntimeMessage[]> {
  try {
    const raw = await fs.readFile(chatPath, 'utf8')
    const lines = raw.split('\n').filter((l) => l.trim())
    // Dedupe by id: if the same message id appears multiple times (from a
    // race where the same message was flushed and re-flushed before this fix,
    // or from concurrent writes), keep only the last entry. Last write wins.
    const byId = new Map<string, RuntimeMessage>()
    for (const line of lines) {
      try {
        const migrated = migratePersistedMessage(JSON.parse(line))
        if (migrated) byId.set(migrated.id, migrated)
      } catch {
        // Corrupt line — skip
      }
    }
    return Array.from(byId.values())
  } catch {
    return []
  }
}

export async function trimTo(chatPath: string, maxMessages: number): Promise<void> {
  const messages = await readAll(chatPath)
  if (messages.length <= maxMessages) return
  // Keep the newest maxMessages entries (last N by timestamp order in file).
  const toKeep = messages.slice(-maxMessages)
  await queueWrite(chatPath, async () => {
    await fs.writeFile(chatPath, toKeep.map((m) => JSON.stringify(m)).join('\n') + '\n', 'utf8')
  })
}

export async function clear(chatPath: string): Promise<void> {
  try {
    await queueWrite(chatPath, async () => {
      await fs.writeFile(chatPath, '', 'utf8')
    })
  } catch {
    // Already gone
  }
}

/**
 * Migration shim: chat rows persisted before Phase 1.4.3 (when the schema
 * changed from `content: string` to `parts: ContentPart[]`) only have a
 * `content` field. Bring them up to the new shape without losing data.
 *
 * The renderer treats `content` as deprecated — it still exists on user
 * messages built in code paths that haven't been migrated, but everything
 * coming through the runtime writes through `parts` instead.
 *
 * Self-heal: any part persisted with a non-'complete' state (e.g. 'streaming'
 * from a flush that raced message-end, or 'pending' from a tool-call-start
 * flush that raced tool-call-end) is treated as 'complete'. A message only
 * reaches chat.jsonl when the runtime decides to flush it, so a
 * streaming/pending state on disk is always a stale partial write.
 */
export function migratePersistedMessage(raw: unknown): RuntimeMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const id = typeof obj.id === 'string' ? obj.id : null
  if (!id) return null
  const role: 'user' | 'assistant' = obj.role === 'assistant' ? 'assistant' : 'user'
  const ts = typeof obj.ts === 'number' ? obj.ts : Date.now()

  let parts: ContentPart[]
  if (Array.isArray(obj.parts)) {
    parts = obj.parts as ContentPart[]
  } else if (typeof obj.content === 'string') {
    parts = [{ type: 'text', text: obj.content, state: 'complete' }]
  } else {
    parts = []
  }

  // Self-heal: normalize any non-complete part state to 'complete'.
  // chat.jsonl is the source of truth for completed turns; any streaming or
  // pending state on disk is a race artifact and must not survive a reload.
  parts = parts.map((p) => {
    switch (p.type) {
      case 'text':
      case 'thinking':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      case 'tool-call':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      case 'tool-result':
        if (p.state !== 'complete') return { ...p, state: 'complete' as const }
        return p
      default:
        return p
    }
  })

  const out: RuntimeMessage = { id, role, parts, ts }
  if (obj.usage && typeof obj.usage === 'object') {
    out.usage = obj.usage as RuntimeMessage['usage']
  }
  return out
}

/**
 * UUID pattern (lowercase, hyphenated, 36 chars, version-4 nibble at pos 14).
 * Matches `crypto.randomUUID()` output exactly.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export interface MigrationResult {
  /** Legacy UUID folders whose chat.jsonl was moved into the agent's folder. */
  moved: Array<{ agentId: string; from: string; to: string }>
  /** Legacy UUID folders that were removed (empty, or their agent folder was gone). */
  evicted: string[]
  /** Legacy UUID folders we couldn't resolve to a known agent (kept as-is). */
  unresolved: string[]
}

/**
 * One-time legacy migration: relocate chat history from
 * `~/.superhive/agents/<uuid>/chat.jsonl` into the agent's actual folder at
 * `<agent.localPath>/chat.jsonl`, then remove the now-empty UUID folder.
 *
 * Idempotent — running twice is a no-op.
 *
 * Cases:
 *   - UUID folder has `chat.jsonl` AND DB row has matching id + `localPath`
 *     exists on disk → move file, evict UUID folder.
 *   - UUID folder is empty AND DB row has matching id → evict UUID folder.
 *   - UUID folder + matching DB row but `localPath` is gone on disk → drop
 *     chat.jsonl + evict UUID folder.
 *   - UUID folder has no matching DB row → leave it. (Future orphans are
 *     cleaned up by `agents:delete` for known agents; unknowns stay so the
 *     user can inspect them manually.)
 *
 * Called from `main.ts` boot sequence after `reconcileAgents()` so the DB
 * is authoritative. Safe to re-run; the matching by `agentId` (folder name)
 * means we won't double-move.
 */
export async function migrateLegacyChatFolders(
  agentsRoot: string = AGENTS_ROOT,
): Promise<MigrationResult> {
  const result: MigrationResult = { moved: [], evicted: [], unresolved: [] }
  if (!existsSync(agentsRoot)) return result

  const agents = await AgentRepository.getAll()
  const byId = new Map<string, { localPath?: string }>()
  for (const a of agents) byId.set(a.id, { localPath: a.localPath })

  const entries = readdirSync(agentsRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!UUID_RE.test(entry.name)) continue
    const uuidDir = join(agentsRoot, entry.name)
    const chatJsonl = join(uuidDir, 'chat.jsonl')
    const hasChat = existsSync(chatJsonl)

    const agent = byId.get(entry.name)
    if (!agent?.localPath) {
      if (hasChat) result.unresolved.push(uuidDir)
      continue
    }

    const targetDir = agent.localPath
    const targetExists = existsSync(targetDir)

    if (!targetExists) {
      // Agent folder is gone (e.g. user wiped it). Drop the chat log so
      // it doesn't haunt the agents root forever, then evict the folder.
      if (hasChat) {
        await fs.rm(chatJsonl, { force: true }).catch(() => {})
      }
      await fs.rm(uuidDir, { recursive: true, force: true }).catch(() => {})
      result.evicted.push(uuidDir)
      continue
    }

    if (hasChat) {
      const targetPath = chatFilePath(targetDir)
      if (existsSync(targetPath)) {
        // Both legacy and new paths exist. Prefer the newer target (more
        // recent writes) and drop the legacy file. The legacy file would
        // only be older here because the new path is the one the runtime
        // started writing to after this migration shipped.
        await fs.rm(chatJsonl, { force: true }).catch(() => {})
      } else {
        renameSync(chatJsonl, targetPath)
      }
      result.moved.push({ agentId: entry.name, from: uuidDir, to: targetPath })
    }

    // UUID folder is now empty (or already was). Evict it so the agents
    // root only contains real agent folders going forward.
    await fs.rm(uuidDir, { recursive: true, force: true }).catch(() => {})
    if (!hasChat) result.evicted.push(uuidDir)
  }

  return result
}
