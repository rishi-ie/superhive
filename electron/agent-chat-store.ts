import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { readdirSync, existsSync, renameSync } from 'node:fs'
import { homedir } from 'node:os'
import { queueWrite } from '../src/storage/queue-write'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import type { AssistantMessage, ChatRow, TimelineItem, UserMessage } from '../src/models/assistant-message'

/**
 * Chat-history persistence lives inside the agent's own folder at
 * `chat.jsonl`. The caller resolves the absolute path and passes it to every
 * function here — this module never touches `~/.superhive/agents/` directly
 * (except for the one-time legacy migration in `migrateLegacyChatFolders`).
 *
 * SuperHive Chat Runtime v2:
 *   - chat.jsonl contains rows of `ChatRow = UserMessage | AssistantMessage`.
 *   - Only finalized `AssistantMessage` rows reach disk. The runtime
 *     never persists streaming state. (Pre-v2 rows that contained
 *     `state: 'streaming'` are migrated on read: their activity timeline
 *     and response blocks are normalized to `complete`.)
 *   - User messages persist immediately on send (handled by the runtime
 *     in `send()`).
 *   - Assistant messages persist only on `message-end` (handled by the
 *     renderer's `agents.persistAssistantMessage` IPC → main process
 *     appendBatch).
 *
 * Why path-explicit:
 *   - One folder per agent on disk. No more UUID-named siblings next to the
 *     agent's named folder.
 *   - The chat log travels with the agent folder if a user moves/renames it.
 *   - `agents:delete` already removes `agent.localPath`, which now removes
 *     the chat log too — no orphan UUID folders left behind.
 *   - The hot path doesn't hit `AgentRepository` for a DB lookup per flush.
 */

export const AGENTS_ROOT = join(homedir(), '.superhive', 'agents')

export function chatFilePath(agentDir: string): string {
  return join(agentDir, 'chat.jsonl')
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true })
}

/**
 * Append a single finalized row. Used for user messages that persist
 * immediately on send, and as the building block for `appendBatch`.
 */
export async function append(chatPath: string, row: ChatRow): Promise<void> {
  await ensureDir(chatPath)
  await queueWrite(chatPath, async () => {
    await fs.appendFile(chatPath, JSON.stringify(row) + '\n', 'utf8')
  })
}

/**
 * Append (or replace, by id) a batch of finalized rows. The hot path for
 * `message-end` → IPC → appendBatch: a single debounced write carries
 * any queued finalized rows.
 *
 * Merges with the existing file by id so the same row flushed twice (a
 * retry, a re-flush) does not produce a duplicate line.
 */
export async function appendBatch(chatPath: string, rows: ChatRow[]): Promise<void> {
  if (rows.length === 0) return
  await ensureDir(chatPath)
  await queueWrite(chatPath, async () => {
    const existing: ChatRow[] = []
    try {
      const raw = await fs.readFile(chatPath, 'utf8')
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        try {
          const m = migratePersistedRow(JSON.parse(line))
          if (m) existing.push(m)
        } catch {
          // Corrupt line — skip
        }
      }
    } catch {
      // File doesn't exist yet
    }
    const byId = new Map<string, ChatRow>()
    for (const r of existing) byId.set(r.id, r)
    for (const r of rows) byId.set(r.id, r)
    const merged = Array.from(byId.values())
    const body =
      merged.length === 0 ? '' : merged.map((m) => JSON.stringify(m)).join('\n') + '\n'
    await fs.writeFile(chatPath, body, 'utf8')
  })
}

/**
 * Read all chat rows for an agent. Deduplicates by id (last-write-wins)
 * so the same row written twice on disk still hydrates as one.
 */
export async function readAll(chatPath: string): Promise<ChatRow[]> {
  try {
    const raw = await fs.readFile(chatPath, 'utf8')
    const lines = raw.split('\n').filter((l) => l.trim())
    const byId = new Map<string, ChatRow>()
    for (const line of lines) {
      try {
        const migrated = migratePersistedRow(JSON.parse(line))
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

export async function trimTo(chatPath: string, maxRows: number): Promise<void> {
  const rows = await readAll(chatPath)
  if (rows.length <= maxRows) return
  const toKeep = rows.slice(-maxRows)
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

// ---------------------------------------------------------------------------
// Migration — pre-v2 rows → ChatRow
// ---------------------------------------------------------------------------

/**
 * Migration shim. Brings older chat rows up to the v2 `ChatRow` shape.
 *
 * Three legacy shapes are handled:
 *
 *   1. v1 user rows: `{ id, role: 'user', content: string, ts }`
 *      → `UserMessage { id, role: 'user', timestamp: ts, text: content }`
 *
 *   2. v1 assistant rows: `{ id, role: 'assistant', parts: ContentPart[],
 *      ts, lineage?, lineageFrozen?, usage? }`
 *      → `AssistantMessage` derived from parts:
 *        - `activityTimeline` ← thinking + tool-call parts (with
 *          state-normalized to 'complete' since chat.jsonl is finalized).
 *        - `response` ← text + image + compaction-summary parts.
 *        - `metadata.usage` ← usage.
 *
 *   3. Anything missing `id` → null (caller skips).
 */
export function migratePersistedRow(raw: unknown): ChatRow | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const id = typeof obj.id === 'string' ? obj.id : null
  if (!id) return null

  const timestamp =
    typeof obj.timestamp === 'number'
      ? obj.timestamp
      : typeof obj.ts === 'number'
        ? obj.ts
        : Date.now()
  const role = obj.role === 'assistant' ? 'assistant' : obj.role === 'user' ? 'user' : null
  if (!role) return null

  if (role === 'user') {
    // v2: `{ id, role: 'user', timestamp, text }`
    if (typeof obj.text === 'string') {
      return { id, role: 'user', timestamp, text: obj.text }
    }
    // v1: `{ id, role: 'user', content: string, ts }`
    if (typeof obj.content === 'string') {
      return { id, role: 'user', timestamp, text: obj.content }
    }
    return null
  }

  // role === 'assistant'
  // v2 row
  if (
    Array.isArray(obj.activityTimeline) &&
    Array.isArray(obj.response) &&
    typeof obj.metadata === 'object'
  ) {
    const out: AssistantMessage = {
      id,
      role: 'assistant',
      timestamp,
      activityTimeline: (obj.activityTimeline as TimelineItem[]).map(normalizeTimelineItem),
      response: normalizeResponseBlocks(obj.response as unknown[]),
      metadata: (obj.metadata as Record<string, unknown>) as AssistantMessage['metadata'],
    }
    return out
  }

  // v1 row with `parts`
  if (Array.isArray(obj.parts)) {
    const parts = obj.parts as Array<Record<string, unknown>>
    const activityTimeline: TimelineItem[] = []
    const response: AssistantMessage['response'] = []

    let nowCounter = 0
    for (const part of parts) {
      const ptype = part.type
      if (ptype === 'thinking') {
        const text = typeof part.text === 'string' ? part.text : ''
        const stateRaw = part.state === 'streaming' ? 'streaming' : 'complete'
        const now = timestamp + nowCounter++
        activityTimeline.push({
          kind: 'thinking',
          id: `thinking-${text.slice(0, 8)}-${activityTimeline.length}`,
          text,
          state: stateRaw,
          startedAt: now,
          endedAt: stateRaw === 'complete' ? now : 0,
        })
      } else if (ptype === 'tool-call') {
        const tcid = typeof part.id === 'string' ? part.id : `tc-${activityTimeline.length}`
        const name = typeof part.name === 'string' ? part.name : ''
        const stateRaw =
          part.state === 'pending'
            ? 'pending'
            : part.state === 'streaming-args'
              ? 'streaming-args'
              : 'complete'
        const now = timestamp + nowCounter++
        activityTimeline.push({
          kind: 'tool-call',
          id: `toolcall-${tcid}`,
          toolName: name,
          state: stateRaw,
          startedAt: now,
          endedAt: stateRaw === 'complete' ? now : null,
        })
      } else if (ptype === 'text') {
        // Legacy v1 parts have no startedAt — fall back to `nowCounter`
        // so the block sorts somewhere reasonable alongside other
        // legacy parts. New writes always carry startedAt.
        const now = timestamp + nowCounter++
        response.push({
          type: 'text',
          text: typeof part.text === 'string' ? part.text : '',
          state: part.state === 'streaming' ? 'streaming' : 'complete',
          startedAt: now,
        })
      } else if (ptype === 'image') {
        const now = timestamp + nowCounter++
        response.push({
          type: 'image',
          data: typeof part.data === 'string' ? part.data : '',
          mimeType: typeof part.mimeType === 'string' ? part.mimeType : 'application/octet-stream',
          startedAt: now,
        })
      } else if (ptype === 'compaction-summary') {
        const now = timestamp + nowCounter++
        response.push({
          type: 'compaction-summary',
          tokensBefore: typeof part.tokensBefore === 'number' ? part.tokensBefore : 0,
          summary: typeof part.summary === 'string' ? part.summary : '',
          startedAt: now,
        })
      }
    }

    const metadata: AssistantMessage['metadata'] = {}
    if (obj.usage && typeof obj.usage === 'object') {
      metadata.usage = obj.usage as AssistantMessage['metadata']['usage']
    }

    const out: AssistantMessage = {
      id,
      role: 'assistant',
      timestamp,
      activityTimeline,
      response,
      metadata,
    }
    return out
  }

  // Legacy: assistant row that pre-dates `parts` (just `content`).
  if (typeof obj.content === 'string') {
    const out: AssistantMessage = {
      id,
      role: 'assistant',
      timestamp,
      activityTimeline: [],
      // Legacy single-content rows have no startedAt — pin to the
      // message timestamp so they don't sort to the top of the order
      // (which would push unrelated timeline items out of position).
      response: [
        { type: 'text', text: obj.content, state: 'complete', startedAt: timestamp },
      ],
      metadata: {},
    }
    return out
  }

  return null
}

function normalizeTimelineItem(raw: unknown): TimelineItem {
  const obj = raw as Record<string, unknown>
  const kind = obj.kind
  if (kind === 'thinking') {
    return {
      kind: 'thinking',
      id: typeof obj.id === 'string' ? obj.id : `t-${Math.random()}`,
      text: typeof obj.text === 'string' ? obj.text : '',
      state: obj.state === 'streaming' ? 'streaming' : 'complete',
      startedAt: typeof obj.startedAt === 'number' ? obj.startedAt : 0,
      endedAt: typeof obj.endedAt === 'number' ? obj.endedAt : 0,
    }
  }
  if (kind === 'tool-call') {
    return {
      kind: 'tool-call',
      id: typeof obj.id === 'string' ? obj.id : `tc-${Math.random()}`,
      toolName: typeof obj.toolName === 'string' ? obj.toolName : '',
      state:
        obj.state === 'pending'
          ? 'pending'
          : obj.state === 'streaming-args'
            ? 'streaming-args'
            : 'complete',
      startedAt: typeof obj.startedAt === 'number' ? obj.startedAt : 0,
      endedAt: typeof obj.endedAt === 'number' ? obj.endedAt : null,
    }
  }
  if (kind === 'completion') {
    return {
      kind: 'completion',
      id: typeof obj.id === 'string' ? obj.id : `c-${Math.random()}`,
    }
  }
  if (kind === 'warning') {
    return {
      kind: 'warning',
      id: typeof obj.id === 'string' ? obj.id : `w-${Math.random()}`,
      message: typeof obj.message === 'string' ? obj.message : '',
    }
  }
  if (kind === 'error') {
    return {
      kind: 'error',
      id: typeof obj.id === 'string' ? obj.id : `e-${Math.random()}`,
      message: typeof obj.message === 'string' ? obj.message : '',
    }
  }
  if (kind === 'system') {
    return {
      kind: 'system',
      id: typeof obj.id === 'string' ? obj.id : `s-${Math.random()}`,
      message: typeof obj.message === 'string' ? obj.message : '',
    }
  }
  return {
    kind: 'planning',
    id: typeof obj.id === 'string' ? obj.id : `p-${Math.random()}`,
    text: typeof obj.text === 'string' ? obj.text : '',
  }
}

function normalizeResponseBlocks(raw: unknown[]): AssistantMessage['response'] {
  const out: AssistantMessage['response'] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>
    // startedAt is required for chronological interleaving. On-disk rows
    // written before the field existed will lack it — pin them to 0 so
    // they sort to the top rather than NaN-comparing and breaking the sort.
    const startedAt = typeof obj.startedAt === 'number' ? obj.startedAt : 0
    if (obj.type === 'text') {
      out.push({
        type: 'text',
        text: typeof obj.text === 'string' ? obj.text : '',
        state: obj.state === 'streaming' ? 'streaming' : 'complete',
        startedAt,
      })
    } else if (obj.type === 'image') {
      out.push({
        type: 'image',
        data: typeof obj.data === 'string' ? obj.data : '',
        mimeType:
          typeof obj.mimeType === 'string' ? obj.mimeType : 'application/octet-stream',
        startedAt,
      })
    } else if (obj.type === 'compaction-summary') {
      out.push({
        type: 'compaction-summary',
        tokensBefore: typeof obj.tokensBefore === 'number' ? obj.tokensBefore : 0,
        summary: typeof obj.summary === 'string' ? obj.summary : '',
        startedAt,
      })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Legacy folder migration
// ---------------------------------------------------------------------------

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
        await fs.rm(chatJsonl, { force: true }).catch(() => {})
      } else {
        renameSync(chatJsonl, targetPath)
      }
      result.moved.push({ agentId: entry.name, from: uuidDir, to: targetPath })
    }

    await fs.rm(uuidDir, { recursive: true, force: true }).catch(() => {})
    if (!hasChat) result.evicted.push(uuidDir)
  }

  return result
}

// ---------------------------------------------------------------------------
// Back-compat re-exports
// ---------------------------------------------------------------------------

/** @deprecated use `ChatRow` from `assistant-message` */
export type { AssistantMessage as AssistantMessageType }

/** @deprecated legacy type alias for pre-v2 callers; prefer `UserMessage` */
export type LegacyUserMessage = UserMessage
