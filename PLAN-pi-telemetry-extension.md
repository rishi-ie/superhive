# Plan — `superhive-pi-telemetry` Extension

**Author:** opencode
**Branch:** `dev` (existing, working tree clean before start)
**Scope:** 1 new sibling repo + 6 Superhive commits, 1 Superhive release per step
**Migration:** New agents only; existing agents keep `RawTextAdapter.maybeEmitUsage` fallback

---

## End-State Architecture

```
[Pi subprocess @ agentDir]
    │
    ├─ stdout JSONL ──► RawTextAdapter (existing fallback path for legacy agents)
    │
    └─ superhive-pi-telemetry extension (NEW)
            │   • session_start  → emit {type:'context', tokens, contextWindow, percent} (one-shot)
            │   • message_update → emit {type:'usage', usage} when usage is non-trivial
            │   • session_shutdown → emit {type:'lifecycle', event:'session_shutdown'}
            ▼
        agentDir/telemetry.jsonl    (JSONL, rotated on session_start)
            │
            ▼
        [TelemetryTailer]            fs.watch + read-from-offset + line buffer + JSON.parse
            │
            ▼
        [general-kai-runtime.handleTelemetryEvent]
            ├─ 'usage'    → entry.usage        → emitStatus
            └─ 'context'  → entry.contextUsage → emitStatus
            ▼
        [RuntimeStatusPayload { usage, contextUsage, ... }]   ← existing IPC channel
            │
            ▼
        [agent-store → useAgentRuntime → <ContextUsageRing>]
```

---

## Step P0 — Initialize extension repo + create GitHub remote

### Why
The new extension must be cloneable by `ensureExtension()` at agent-creation time. Without a reachable GitHub URL, symlink fails and new agents break. Local dir is created so we can author files in P1; remote is created before so it's reachable immediately.

### What
- Local dir `/Users/rishi/work/superhive-5/superhive-pi-telemetry/` (empty).
- GitHub repo `rishi-ie/superhive-pi-telemetry` (public).
- Local git initialized with `main` branch, tracking `origin`.
- A placeholder README committed so `gh repo create --source=. --push` can complete (empty repo pushes fail).

### How
```bash
mkdir -p /Users/rishi/work/superhive-5/superhive-pi-telemetry
cd /Users/rishi/work/superhive-5/superhive-pi-telemetry
git init -b main
# Placeholder commit so the repo can be pushed
printf '# superhive-pi-telemetry\n\nInitialized — source pending.\n' > README.md
git add README.md
git commit -m "chore: initialize repo"
gh repo create rishi-ie/superhive-pi-telemetry --public \
  --description "Streams Pi usage + context telemetry to a per-agent JSONL journal Superhive tails for real-time UI telemetry." \
  --source=. --remote=origin --push
```

### Commit (in P0 dir, not Superhive)
```
chore: initialize superhive-pi-telemetry repo
```

---

## Step 1 — Scaffold extension source files

### Why
Pi loads extensions at runtime via `jiti` (no build step — matches `superhive-pi-truth`). Files must declare `pi.extensions` in `package.json` and export a default function that registers hook handlers.

### What
Six files in `/Users/rishi/work/superhive-5/superhive-pi-telemetry/`:

#### `package.json`
```json
{
  "name": "superhive-pi-telemetry",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Streams Pi per-message usage + one-shot context snapshot to a JSONL journal Superhive tails for real-time UI telemetry.",
  "scripts": {
    "clean": "echo nothing to clean",
    "build": "echo nothing to build",
    "check": "echo nothing to check"
  },
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

#### `.gitignore`
```
node_modules/
.DS_Store
*.log
dist/
.telemetry/
```

#### `types.ts`
```ts
export interface UsageSnapshot {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  cacheWrite1h?: number
  reasoning?: number
  totalTokens: number
  cost: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
    total: number
  }
}

export interface ContextSnapshot {
  tokens: number | null
  contextWindow: number
  percent: number | null
}

export interface LifecycleEvent {
  ts: number
  type: 'lifecycle'
  event: 'session_start' | 'session_shutdown'
}

export interface UsageEvent {
  ts: number
  type: 'usage'
  usage: UsageSnapshot
}

export interface ContextEvent {
  ts: number
  type: 'context'
  tokens: number | null
  contextWindow: number
  percent: number | null
}

export type TelemetryEvent = UsageEvent | ContextEvent | LifecycleEvent
```

#### `journal.ts`
```ts
import { appendFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function appendEvent(journalPath: string, event: object): void {
  appendFileSync(journalPath, JSON.stringify(event) + '\n')
}

export function rotateJournal(journalPath: string): void {
  try {
    renameSync(journalPath, `${journalPath}.1`)
  } catch {
    /* nothing to rotate */
  }
  writeFileSync(journalPath, '')
}

export function journalPathFor(workspaceCwd: string): string {
  return join(dirname(workspaceCwd), 'telemetry.jsonl')
}
```

#### `index.ts`
```ts
import { appendEvent, journalPathFor, rotateJournal } from './journal.js'
import type { ContextSnapshot, UsageSnapshot } from './types.js'

type ExtensionAPI = {
  on: (event: string, handler: (...args: unknown[]) => unknown) => void
}

type MessageUpdatePayload = {
  assistantMessageEvent?: { partial?: { usage?: UsageSnapshot } }
}

type SessionStartCtx = {
  cwd: string
  getContextUsage?: () => ContextSnapshot | undefined
}

export default function (pi: ExtensionAPI): void {
  let journalPath: string | null = null
  let lastUsageRef: UsageSnapshot | null = null

  pi.on('session_start', async (_event: unknown, ctx: SessionStartCtx) => {
    journalPath = journalPathFor(ctx.cwd)
    rotateJournal(journalPath)
    appendEvent(journalPath, { ts: Date.now(), type: 'lifecycle', event: 'session_start' })
    const snapshot = ctx.getContextUsage?.()
    if (snapshot) {
      appendEvent(journalPath, { ts: Date.now(), type: 'context', ...snapshot })
    }
  })

  pi.on('message_update', async (event: MessageUpdatePayload) => {
    if (!journalPath) return
    const usage = event?.assistantMessageEvent?.partial?.usage as UsageSnapshot | undefined
    if (!usage) return
    const totalActivity = usage.input + usage.output + usage.cacheRead + usage.cacheWrite
    if (totalActivity <= 0 && (!usage.totalTokens || usage.totalTokens <= 0)) return
    if (lastUsageRef === usage) return
    lastUsageRef = usage
    appendEvent(journalPath, { ts: Date.now(), type: 'usage', usage })
  })

  pi.on('session_shutdown', () => {
    if (!journalPath) return
    appendEvent(journalPath, { ts: Date.now(), type: 'lifecycle', event: 'session_shutdown' })
    journalPath = null
    lastUsageRef = null
  })
}
```

#### `README.md`
```markdown
# superhive-pi-telemetry

Streams Pi per-message token usage and a one-shot context snapshot to a per-agent JSONL journal that Superhive tails for real-time UI telemetry.

## Journal schema

Path: `<agentDir>/telemetry.jsonl`

Each line is a JSON-encoded event:

```json
{"ts":1700000000000,"type":"lifecycle","event":"session_start"}
{"ts":1700000001000,"type":"context","tokens":42000,"contextWindow":200000,"percent":0.21}
{"ts":1700000050000,"type":"usage","usage":{"input":42000,"output":200,"cacheRead":0,"cacheWrite":0,"totalTokens":42200,"cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}}}
{"ts":1700000099000,"type":"lifecycle","event":"session_shutdown"}
```

## Event types

| `type` | When | Notes |
|---|---|---|
| `lifecycle` | `session_start`, `session_shutdown` | Bookend events for the journal |
| `context` | One shot on `session_start` | `getContextUsage()` snapshot. Captures `contextWindow` once per session |
| `usage` | Every non-trivial `message_update` | Full Pi `Usage` object (input/output/cacheRead/cacheWrite/reasoning/cost) |

The journal rotates once per session — the previous run's contents are renamed to `telemetry.jsonl.1`.
```

### How
- `write` each of the 6 files.
- `cd /Users/rishi/work/superhive-5/superhive-pi-telemetry`
- `git add .` → `git commit` → `git push -u origin main`

### Commit (in extension repo)
```
feat(extension): scaffold superhive-pi-telemetry with usage + context streaming
```

---

## Step 2 — Wire distribution in Superhive (`dev` branch)

### Why
For new agents, the manifest template must declare the extension (so Pi loads it) AND the agent-creation code must symlink the extension source into `agentDir/extensions/` (so Pi's loader can resolve it via the relative `./extensions/superhive-pi-telemetry` path in `manifest.json`). Without the symlink, Pi would fail to find `./extensions/superhive-pi-telemetry/index.ts`. Without the manifest declaration, Pi would never load the extension even if symlinked.

### What
Three edits to existing files in `superhive/`:

#### `electron/extension-source.ts`
Add two constants near the existing `SUPERHIVE_PI_TRUTH_NAME` / `SUPERHIVE_PI_TRUTH_URL`:
```ts
export const SUPERHIVE_PI_TELEMETRY_NAME = 'superhive-pi-telemetry'
export const SUPERHIVE_PI_TELEMETRY_URL = 'https://github.com/rishi-ie/superhive-pi-telemetry.git'
```

#### `electron/ipc/agents.ts`
After the existing truth-extension symlink block (~line 86), mirror it for telemetry:
```ts
const telemetrySource = ensureExtension(SUPERHIVE_PI_TELEMETRY_NAME, SUPERHIVE_PI_TELEMETRY_URL)
const telemetryLink = join(agentDir, 'extensions', SUPERHIVE_PI_TELEMETRY_NAME)
symlinkSync(telemetrySource, telemetryLink, 'dir')
```
Top-of-file: add import of the two new constants.

#### `electron/agent-settings-defaults.ts`
Extend the `extensions` array in the manifest template (where truth extension is currently listed):
```ts
extensions: ['./extensions/superhive-pi-truth', './extensions/superhive-pi-telemetry']
```

### How
- Edit each file with the `edit` tool.
- `bun run typecheck` must pass.
- `bun run build` must pass.
- Stage three paths, commit.

### Verification
- `grep -r SUPERHIVE_PI_TELEMETRY_NAME electron/` returns both definition and use.
- `grep -r "superhive-pi-telemetry" electron/` returns three references (URL, manifest, symlink).

### Commit
```
feat(superhive): wire superhive-pi-telemetry into agent creation
```

---

## Step 3 — `TelemetryTailer` class

### Why
The runtime must consume the JSONL journal asynchronously, without blocking Pi's stdout consumer, and without re-reading lines that have already been processed. The tailer reads from a stored offset and recovers from truncation (rotation renames the file and creates a new one — the size shrinks, offset must reset).

### What
New file `electron/pi-protocol/telemetry-tailer.ts`:

```ts
import { existsSync, type FSWatcher, openSync, readSync, statSync, watch } from 'node:fs'
import log from 'electron-log/main'

export class TelemetryTailer {
  private watcher: FSWatcher | null = null
  private offset = 0
  private lineBuffer = ''
  private debounceTimer: NodeJS.Timeout | null = null
  private lineCount = 0

  constructor(
    private readonly journalPath: string,
    private readonly onEvent: (event: unknown) => void,
  ) {}

  start(): void {
    if (!existsSync(this.journalPath)) {
      log.debug(`[telemetry-tailer] no journal yet at ${this.journalPath}; will start when file appears`)
    }
    try {
      this.watcher = watch(this.journalPath, () => this.scheduleRead())
    } catch (err) {
      log.warn(`[telemetry-tailer] failed to watch ${this.journalPath}:`, err)
      return
    }
    this.scheduleRead()
  }

  stop(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = null
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }

  private scheduleRead(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      this.readNew()
    }, 30)
  }

  private readNew(): void {
    if (!existsSync(this.journalPath)) return
    let size: number
    try {
      size = statSync(this.journalPath).size
    } catch {
      return
    }
    if (size < this.offset) {
      log.debug(`[telemetry-tailer] journal truncated (size=${size} < offset=${this.offset}); resetting`)
      this.offset = 0
      this.lineBuffer = ''
    }
    if (size <= this.offset) return

    let fd: number
    try {
      fd = openSync(this.journalPath, 'r')
    } catch (err) {
      log.warn(`[telemetry-tailer] open failed for ${this.journalPath}:`, err)
      return
    }
    try {
      const length = size - this.offset
      const buf = Buffer.alloc(length)
      readSync(fd, buf, 0, length, this.offset)
      this.lineBuffer += buf.toString('utf8')
      this.offset = size

      let nlIdx: number
      while ((nlIdx = this.lineBuffer.indexOf('\n')) !== -1) {
        const line = this.lineBuffer.slice(0, nlIdx).replace(/\r$/, '')
        this.lineBuffer = this.lineBuffer.slice(nlIdx + 1)
        if (!line) continue
        try {
          const event = JSON.parse(line) as { type?: string; usage?: unknown; [k: string]: unknown }
          if (event && typeof event === 'object' && typeof event.type === 'string') {
            this.onEvent(event)
            this.lineCount++
          }
        } catch (err) {
          log.warn(`[telemetry-tailer] malformed line at ${this.journalPath}:${this.lineCount}:`, err)
        }
      }
    } catch (err) {
      log.warn(`[telemetry-tailer] read failed for ${this.journalPath}:`, err)
    } finally {
      try {
        require('node:fs').closeSync(fd)
      } catch {
        /* fd already closed or unavailable */
      }
    }
  }
}
```

> **Implementation note**: the `require('node:fs').closeSync(fd)` is a fallback inside the `finally` block. Replace with `import { closeSync } from 'node:fs'` at the top of the file and use `closeSync(fd)` directly — this matches the rest of the codebase.

Final shape (corrected):
```ts
import { closeSync, existsSync, openSync, readSync, statSync, watch, type FSWatcher } from 'node:fs'
```

### How
- `write` the new file (with the corrected imports).
- `bun run typecheck` clean.
- `bun run build` clean.

### Verification
- `grep "TelemetryTailer" electron/` returns the new file.
- No circular imports (no `@/api/*`, no Electron renderer code).

### Commit
```
feat(runtime): add telemetry journal tailer
```

---

## Step 4 — Runtime routing

### Why
Tailer events must reach the renderer. We do this by:
1. Adding the canonical `ContextSnapshot` interface to `electron/pi-protocol/types.ts` so all layers share one shape.
2. Storing `entry.usage` and `entry.contextUsage` on `RuntimeEntry` keyed by latest tailer event.
3. Re-emitting via the existing `agents:onStatus` channel (which is already plumbed end-to-end through preload → renderer → `useAgentRuntime`). No new IPC channel needed.

### What

#### `electron/pi-protocol/types.ts`
Add the `ContextSnapshot` interface (re-exported through the renderer via `models/runtime.ts` → `types/electron.d.ts`):
```ts
export interface ContextSnapshot {
  tokens: number | null
  contextWindow: number
  percent: number | null
}
```

#### `electron/general-kai-runtime.ts`
- Imports: add `import { TelemetryTailer } from './pi-protocol/telemetry-tailer'`.
- `RuntimeEntry`: add `contextUsage?: ContextSnapshot` (already has `usage?: UsageSnapshot`).
- Class: add `private telemetryTailers = new Map<string, TelemetryTailer>()`.
- In `start()`, after `this.spawnProcess(entry)`:
  ```ts
  const journalPath = join(entry.agentDir, 'telemetry.jsonl')
  const tailer = new TelemetryTailer(journalPath, (ev) => this.handleTelemetryEvent(agentId, ev as TelemetryWireEvent))
  tailer.start()
  this.telemetryTailers.set(agentId, tailer)
  ```
  (Add a private type alias `type TelemetryWireEvent = { type: string; [k: string]: unknown }`.)
- Add `handleTelemetryEvent(agentId, event)`:
  ```ts
  private handleTelemetryEvent(agentId: string, event: TelemetryWireEvent): void {
    const entry = this.entries.get(agentId)
    if (!entry) return
    if (event.type === 'usage' && event.usage && typeof event.usage === 'object') {
      entry.usage = event.usage as UsageSnapshot
      this.emitStatus(agentId)
    } else if (event.type === 'context') {
      const tokens = typeof event.tokens === 'number' ? event.tokens : null
      const contextWindow = typeof event.contextWindow === 'number' ? event.contextWindow : 0
      const percent = typeof event.percent === 'number' ? event.percent : null
      if (contextWindow > 0) {
        entry.contextUsage = { tokens, contextWindow, percent }
        this.emitStatus(agentId)
      }
    }
    // 'lifecycle' events are consumed but don't change UI state.
  }
  ```
- `emitStatus(...)`: add `contextUsage: entry.contextUsage` to the payload.
- `getStatusPayload(...)`: add `contextUsage: entry.contextUsage` to the returned shape.
- `removeEntry(agentId)`: also `this.telemetryTailers.get(agentId)?.stop()` + delete.
- `pruneStaleEntries()`: also stop the tailer when pruning.
- `shutdownAll()`: also stop all tailers.

#### `src/models/runtime.ts`
Add to imports:
```ts
import type { InitStep, UsageSnapshot, ContextSnapshot } from '../../electron/pi-protocol/types'
export type { InitStep, UsageSnapshot, ContextSnapshot } from '../../electron/pi-protocol/types'
```
Extend `RuntimeStatusPayload`:
```ts
contextUsage?: ContextSnapshot
```

#### `src/types/electron.d.ts`
Re-export the new type alongside the existing exports:
```ts
export type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload }
export type { InitStep, AdapterEvent, UsageSnapshot, ContextSnapshot }
```

### How
- `edit` each file with the precise diffs above.
- `bun run typecheck` clean.
- `bun run build` clean.

### Verification
- `grep -r contextUsage electron/ src/` returns definition + 3 uses (entry, emitStatus, getStatusPayload) + 1 render-side type re-export.
- `rg "@/api" src/components src/pages` still returns zero.

### Commit
```
feat(runtime): route telemetry tailer events through RuntimeStatusPayload
```

---

## Step 5 — Renderer state (`useAgentRuntime.contextUsage`)

### Why
The renderer's hook needs `contextUsage` so the composer can read the real `contextWindow` from Pi when available. Mirrors how `usage` was added (commit `db80b0a`).

### What
`src/flows/agents/agent-store.ts`:

1. Imports: `import type { ..., ContextSnapshot } from '@/types/electron'`.
2. `RuntimeSlice` interface: add `contextUsage?: ContextSnapshot`.
3. `initRuntimeSlice(...)` initial slice object: `contextUsage: undefined`.
4. Inside `agents.getRuntimeState(agentId).then((s) => {...})`: add `entry.contextUsage = s.contextUsage`.
5. Inside `agents.onStatus(...)` handler: add `entry.contextUsage = s.contextUsage`.
6. `useAgentRuntime(...)` hook:
   - Add `const [contextUsage, setContextUsage] = React.useState<ContextSnapshot | undefined>(undefined)`.
   - Inside `sync()`: `setContextUsage(sliceRef.current.contextUsage)`.
   - Return: include `contextUsage` alongside `usage`.

### How
- `edit` `src/flows/agents/agent-store.ts`.
- `bun run typecheck` clean.

### Verification
- `grep -n contextUsage src/flows/agents/agent-store.ts` returns 5+ matches.

### Commit
```
feat(agents): expose contextUsage from useAgentRuntime
```

---

## Step 6 — Composer uses real `contextWindow`

### Why
The composers currently hardcode `const CONTEXT_WINDOW = 200000`. Now that telemetry gives us the real `contextWindow` (which Pi reports via `getContextUsage()`), we should use it when available — falling back to the hardcoded value for legacy agents that don't have the extension.

### What

#### `src/pages/agent-chat/AgentChatView.tsx`
- Add `contextUsage` to the destructured set from `useAgentRuntime(agentId)`:
  ```ts
  const { agent, status, messages, lastError, bootStep, usage, contextUsage, loading, send, restart } = useAgentRuntime(agentId)
  ```
- Replace `const CONTEXT_WINDOW = 200000` with:
  ```ts
  const CONTEXT_WINDOW_FALLBACK = 200000
  const contextWindow = contextUsage?.contextWindow ?? CONTEXT_WINDOW_FALLBACK
  ```
- In the `<ContextUsageRing>` JSX:
  ```tsx
  <ContextUsageRing
    percent={usage ? Math.min(100, (usage.input / contextWindow) * 100) : 0}
    usedTokens={usage?.input}
    maxTokens={contextWindow}
  />
  ```

#### `src/pages/project-chat/ProjectChatView.tsx`
Same three edits:
- Add `contextUsage` to the destructured set from `useAgentRuntime(projectAgent.id)`.
- Replace `const CONTEXT_WINDOW = 200000` with the fallback pattern above.
- Update `<ContextUsageRing>` JSX.

### How
- `edit` each file.
- `bun run typecheck` clean.
- `bun run build` clean.

### Verification
- Both composers reference `contextUsage?.contextWindow ?? CONTEXT_WINDOW_FALLBACK`.
- `<ContextUsageRing maxTokens={contextWindow} />` (no longer hardcoded 200000).
- `rg "@/api" src/components src/pages` returns zero.
- Style grep checks (no raw palette, no `space-x/y-*`) all pass.

### Commit
```
feat(composer): use real contextWindow from telemetry when available
```

---

## Cross-Step Verification Matrix

| Check | P0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| `gh repo view` exists | ✓ | – | – | – | – | – | – |
| `https://github.com/rishi-ie/superhive-pi-telemetry` shows 6+ files on main | – | ✓ | – | – | – | – | – |
| `bun run typecheck` clean | – | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| `bun run build` clean | – | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| `rg "@/api" src/components src/pages` returns zero | – | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| Style mod grep checks pass | – | – | ✓ | ✓ | ✓ | ✓ | ✓ |

## Smoke Test Plan (Post-Step-6)

1. `bun run electron:dev` — wait for window to load.
2. Create a new agent via the dialog. Confirm:
   - `~/.superhive/agents/{folder}/extensions/superhive-pi-telemetry` symlink points to `~/.superhive/extensions/superhive-pi-telemetry`.
   - `~/.superhive/extensions/superhive-pi-telemetry/index.ts` exists (cloned).
3. Start a chat session. Confirm:
   - `~/.superhive/agents/{folder}/telemetry.jsonl` appears.
   - First lines are: `lifecycle session_start` → `context {tokens, contextWindow, percent}`.
   - Send a message → receive response → after the response: `usage {usage: {...}}` lines accumulate.
4. Open the chat composer → confirm `<ContextUsageRing>` reflects the latest `usage.input / contextUsage.contextWindow`.
5. Hover the ring → tooltip text matches the latest usage (`Context: 47% (94,000 / 200,000 tokens)`).
6. Restart the agent → journal rotates (`telemetry.jsonl.1` contains previous run's events).
7. Leave existing pre-extension agent untouched → it still gets `usage` via `RawTextAdapter.maybeEmitUsage` (fallback path).

## Risks

- **Empty `gh` push**: `gh repo create --source=. --push` requires at least one commit. Mitigated by placeholder README in P0.
- **`ctx.getContextUsage()` not yet boundled**: silent-skip path; falls back to hardcoded contextWindow. Documented in extension.
- **Tailer truncation race**: handled by `if (size < offset) reset` in `TelemetryTailer.readNew()`.
- **`appendFileSync` line atomicity**: < 4KB per line on POSIX is atomic. JSONL lines are < 1KB.
- **Multiple agents writing to the same journal**: each agent has its own `agentDir` and journal — no collision.
- **Old agents not migrated**: explicit decision per user; fallback path covers them indefinitely.

## Rollback Strategy

Each Superhive commit is independently revertable. To roll back the entire feature:
```bash
git revert 38cc479 db80b0a 01f22cf 3026a14 --no-edit
# + the unique SHAs from steps 2-6 (capture during execution)
```
To roll back the extension:
```bash
gh repo delete rishi-ie/superhive-pi-telemetry --yes
```
```