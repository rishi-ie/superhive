import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import {
  type AdapterEvent,
  type PiProtocolAdapter,
  type InitStep,
  type UsageSnapshot,
  type ContextSnapshot,
  type ModelInfo,
  RawTextAdapter,
} from './pi-protocol'
import { TelemetryTailer } from './pi-protocol/telemetry-tailer'
import type { AgentStatus } from '../src/storage/types'
import type { RuntimeStatusPayload, RuntimeMessage } from '../src/types/electron'
import { IPC } from './ipc/index'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { parseCounter } from './agent-settings-defaults'
import { appendBatch } from './agent-chat-store'

/**
 * Live runtime state for one agent instance.
 * Single-threaded JS: all mutations are safe without locks.
 */
export interface RuntimeEntry {
  // config
  agentId: string
  agentDir: string
  manifestPiSource: string
  // process
  process: ChildProcess | null
  pid?: number
  startedAt?: number
  endedAt?: number
  // conversation
  messages: RuntimeMessage[]
  // debug
  stderrLog: string[]
  // boot
  status: AgentStatus
  bootStep?: InitStep
  lastError?: string
  // usage
  usage?: UsageSnapshot
  contextUsage?: ContextSnapshot
  // telemetry extension: true = extension present, journal tailer is sole writer
  // for usage; false = legacy agent, stdout adapter fallback drives usage
  extensionLoaded: boolean
  availableModels?: ModelInfo[]
  // Active model reported by Pi on model_select. The SDK sends the new
  // model's full Model object (including contextWindow) — we keep just the
  // fields the composer needs, so a custom provider whose value Pi tracks
  // internally (rather than via the registry) still flows through.
  activeModelContextWindow?: number
  activeModelName?: string
  // adapter
  adapter: PiProtocolAdapter
  // chat persistence
  _chatPending: Set<string>
  _chatDebounceTimer: NodeJS.Timeout | null
  // live status envelopes (set by 1.2 handlers, read by getStatusPayload/emitStatus)
  compaction?: import('../src/models/runtime').CompactionStatus
  retry?: import('../src/models/runtime').RetryStatus
}

const STDERR_LOG_LIMIT = 500
const READY_SILENCE_MS = 2000
const TAILER_AUTO_STOP_MS = 30_000

type TelemetryWireEvent = {
  type: string
  usage?: UsageSnapshot
  tokens?: number | null
  contextWindow?: number
  percent?: number | null
  event?: string
  provider?: string
  id?: string
  name?: string
  [k: string]: unknown
}

/**
 * Manages live Pi runtime processes for all agents.
 * Single-threaded JS: all `entries` map mutations are safe without locks.
 */
class GeneralKaiRuntime {
  private entries = new Map<string, RuntimeEntry>()
  private adapterFactories = new Map<string, () => PiProtocolAdapter>()
  private silenceTimers = new Map<string, NodeJS.Timeout>()
  private readyEmitted = new Set<string>()
  private settingsWatchers = new Map<string, FSWatcher>()
  private telemetryTailers = new Map<string, TelemetryTailer>()
  private lastSeenCounter = new Map<string, number>()

  /**
   * Register a custom PiProtocolAdapter factory for an agent.
   * Allows swapping the text-adapter for a structured-JSONL adapter in the future.
   */
  registerAdapterFactory(agentId: string, factory: () => PiProtocolAdapter): void {
    this.adapterFactories.set(agentId, factory)
  }

  /** Returns the full runtime entry (includes process handle — do not persist). */
  getState(agentId: string): RuntimeEntry | null {
    return this.entries.get(agentId) ?? null
  }

  /** Returns a serializable snapshot of runtime state for IPC. */
  getStatusPayload(agentId: string): RuntimeStatusPayload | null {
    const entry = this.entries.get(agentId)
    if (!entry) return null
    return {
      agentId: entry.agentId,
      status: entry.status,
      pid: entry.pid,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      lastError: entry.lastError,
      bootStep: entry.bootStep,
      usage: entry.usage,
      contextUsage: entry.contextUsage,
      availableModels: entry.availableModels,
      activeModelContextWindow: entry.activeModelContextWindow,
      activeModelName: entry.activeModelName,
      compaction: entry.compaction,
      retry: entry.retry,
    }
  }

  listAgents(): string[] {
    return Array.from(this.entries.keys())
  }

  isRunning(agentId: string): boolean {
    const entry = this.entries.get(agentId)
    return !!entry?.process && entry.status !== 'stopped' && entry.status !== 'error'
  }

  /** Spawn a new Pi process for an agent. Idempotent — ignored if already running. */
  start(agentId: string, agentDir: string, manifestPiSource: string): void {
    if (this.isRunning(agentId)) {
      log.info(`[runtime] agent ${agentId} already running, ignoring start`)
      return
    }

    const existing = this.entries.get(agentId)
    const factory = this.adapterFactories.get(agentId) ?? (() => new RawTextAdapter())
    const adapter = factory()

    const entry: RuntimeEntry = existing ?? {
      agentId,
      agentDir,
      manifestPiSource,
      process: null,
      status: 'initializing',
      messages: [],
      stderrLog: [],
      adapter,
      usage: undefined,
      contextUsage: undefined,
      extensionLoaded: false,
      availableModels: undefined,
      _chatPending: new Set(),
      _chatDebounceTimer: null,
    }

    entry.adapter = adapter
    entry.agentDir = agentDir
    entry.manifestPiSource = manifestPiSource
    entry.status = 'initializing'
    entry.startedAt = Date.now()
    entry.endedAt = undefined
    entry.lastError = undefined
    entry.bootStep = undefined
    entry.usage = undefined
    entry.contextUsage = undefined
    entry.extensionLoaded = existsSync(join(agentDir, 'extensions', 'superhive-pi-telemetry'))
    entry.availableModels = undefined
    entry.activeModelContextWindow = undefined
    entry.activeModelName = undefined
    entry.stderrLog = []
    entry._chatPending = new Set()
    entry._chatDebounceTimer = null
    adapter.reset()

    this.entries.set(agentId, entry)
    this.emitStatus(agentId)
    this.spawnProcess(entry)
    this.startTelemetryTailer(entry)
  }

  /** Send SIGABRT + SIGTERM to the process. Sets status to 'stopped'. */
  stop(agentId: string): void {
    this.clearSilenceTimer(agentId)
    this.readyEmitted.delete(agentId)
    const entry = this.entries.get(agentId)
    if (!entry?.process) {
      if (entry) {
        this.transitionStatus(entry, 'stopped')
      }
      return
    }
    this.terminateProcess(entry.process)
    setTimeout(() => {
      if (!entry.process?.killed) {
        entry.process?.kill('SIGTERM')
      }
    }, 500)
  }

  restart(agentId: string): void {
    const entry = this.entries.get(agentId)
    if (!entry) return
    this.stop(agentId)
    setTimeout(() => this.start(agentId, entry.agentDir, entry.manifestPiSource), 800)
  }

  send(agentId: string, text: string): boolean {
    const entry = this.entries.get(agentId)
    if (!entry?.process) return false
    if (!text.trim()) return false
    const userMsg: RuntimeMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text, state: 'complete' }],
      ts: Date.now(),
    }
    entry.messages.push(userMsg)
    entry._chatPending.add(userMsg.id)
    this.scheduleChatPersist(entry)
    this.transitionStatus(entry, 'busy')
    this.emitMessages(agentId)
    log.debug(`[runtime.send] agent=${agentId} wire=${entry.adapter.serializeInput(text).replace(/\n$/, '')}`)
    try {
      const wire = entry.adapter.serializeInput(text)
      entry.process.stdin?.write(wire)
      return true
    } catch (err) {
      log.error(`[runtime] send failed for ${agentId}:`, err)
      entry.lastError = err instanceof Error ? err.message : String(err)
      this.transitionStatus(entry, 'error')
      return false
    }
  }

  async shutdownAll(): Promise<void> {
    this.closeAllSettingsWatchers()
    for (const agentId of Array.from(this.silenceTimers.keys())) {
      this.clearSilenceTimer(agentId)
    }
    this.readyEmitted.clear()
    for (const agentId of Array.from(this.telemetryTailers.keys())) {
      this.stopTelemetryTailer(agentId)
    }
    for (const [, entry] of this.entries) {
      if (entry.process) {
        this.terminateProcess(entry.process)
        entry.status = 'stopped'
        log.info(`[runtime] shutdown agent ${entry.agentId}`)
      }
    }
    setTimeout(() => {
      for (const [, entry] of this.entries) {
        if (entry.process && !entry.process.killed) {
          try {
            entry.process.kill('SIGKILL')
          } catch {}
          log.warn(`[runtime] SIGKILL agent ${entry.agentId}`)
        }
      }
    }, 3000)
    await this.flushAllChats()
  }

  // ============================================================
  // CHAT PERSISTENCE
  // ============================================================

  private scheduleChatPersist(entry: RuntimeEntry): void {
    if (entry._chatDebounceTimer) {
      clearTimeout(entry._chatDebounceTimer)
    }
    entry._chatDebounceTimer = setTimeout(() => {
      this.flushChatEntry(entry)
    }, 1000)
  }

  private async flushChatEntry(entry: RuntimeEntry): Promise<void> {
    entry._chatDebounceTimer = null
    if (entry._chatPending.size === 0) return
    const msgs: RuntimeMessage[] = []
    for (const id of entry._chatPending) {
      const msg = entry.messages.find((m) => m.id === id)
      if (msg) msgs.push(msg)
    }
    entry._chatPending.clear()
    if (msgs.length === 0) return
    try {
      await appendBatch(entry.agentId, msgs)
      if (entry.messages.length > 5000) {
        const { trimTo } = await import('./agent-chat-store')
        trimTo(entry.agentId, 5000).catch((err) =>
          log.warn(`[runtime] chat trim failed for ${entry.agentId}:`, err),
        )
      }
    } catch (err) {
      log.warn(`[runtime] chat persist failed for ${entry.agentId}:`, err)
    }
  }

  async flushAllChats(): Promise<void> {
    await Promise.all(
      Array.from(this.entries.values()).map((entry) => {
        if (entry._chatDebounceTimer) {
          clearTimeout(entry._chatDebounceTimer)
          entry._chatDebounceTimer = null
        }
        return this.flushChatEntry(entry)
      }),
    )
  }

  ensureSettingsWatcher(agentId: string, settingsPath: string): void {
    if (this.settingsWatchers.has(agentId)) return
    const win = this.getWindow()
    if (!win) return

    let debounceTimer: NodeJS.Timeout | null = null
    const watcher = watch(settingsPath, (eventType) => {
      if (eventType !== 'change' && eventType !== 'rename') return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        if (win.isDestroyed()) return
        try {
          const raw = await fs.readFile(settingsPath, 'utf8')
          const parsed = JSON.parse(raw) as { managedBy?: string }
          const onDisk = parseCounter(parsed.managedBy)
          const prev = this.lastSeenCounter.get(agentId) ?? 0
          if (onDisk <= prev) return
          this.lastSeenCounter.set(agentId, onDisk)
        } catch {
          return
        }
        win.webContents.send(IPC.AGENTS.ON_SETTINGS_CHANGED(agentId), agentId)
      }, 100)
    })

    watcher.on('error', (err) => {
      log.warn(`[settings-watcher] error for ${agentId}:`, err)
    })

    this.settingsWatchers.set(agentId, watcher)
    log.info(`[settings-watcher] started for ${agentId} → ${settingsPath}`)
  }

  private closeSettingsWatcher(agentId: string): void {
    const existing = this.settingsWatchers.get(agentId)
    if (!existing) return
    existing.close()
    this.settingsWatchers.delete(agentId)
    log.info(`[settings-watcher] stopped for ${agentId}`)
  }

  private closeAllSettingsWatchers(): void {
    for (const [agentId] of this.settingsWatchers) {
      this.closeSettingsWatcher(agentId)
    }
  }

  removeEntry(agentId: string): void {
    this.clearSilenceTimer(agentId)
    this.readyEmitted.delete(agentId)
    this.closeSettingsWatcher(agentId)
    this.stopTelemetryTailer(agentId)
    this.lastSeenCounter.delete(agentId)
    this.stop(agentId)
    this.entries.delete(agentId)
  }

  /**
   * Called by the WRITE_SETTINGS IPC handler after it successfully bumps the
   * counter. Keeps the watcher's self-write guard in sync so the watcher does
   * not re-broadcast a change we just wrote ourselves.
   */
  markSelfWrite(agentId: string, counter: number): void {
    this.lastSeenCounter.set(agentId, counter)
  }

  /**
   * Drop any runtime entries whose agent folder no longer exists on disk.
   * Run at app startup to avoid wasting spawn attempts on agents whose data
   * was wiped (e.g. via `bun run reset`).
   */
  pruneStaleEntries(): void {
    for (const [id, entry] of this.entries) {
      if (entry.agentDir && !existsSync(entry.agentDir)) {
        log.info(`[runtime] pruning stale entry for ${id} (folder missing: ${entry.agentDir})`)
        this.clearSilenceTimer(id)
        this.readyEmitted.delete(id)
        this.lastSeenCounter.delete(id)
        this.stopTelemetryTailer(id)
        if (entry.process) {
          try { entry.process.kill('SIGTERM') } catch { /* ignore */ }
        }
        this.entries.delete(id)
      }
    }
  }

  // ============================================================
  // TELEMETRY (extension → renderer via per-agent JSONL journal)
  // ============================================================

  private startTelemetryTailer(entry: RuntimeEntry): void {
    if (this.telemetryTailers.has(entry.agentId)) return
    const journalPath = join(entry.agentDir, 'telemetry.jsonl')
    const tailer = new TelemetryTailer(journalPath, (ev) =>
      this.handleTelemetryEvent(entry.agentId, ev as TelemetryWireEvent),
    )
    tailer.start()
    this.telemetryTailers.set(entry.agentId, tailer)
    setTimeout(() => {
      const t = this.telemetryTailers.get(entry.agentId)
      if (t === tailer) {
        log.info(`[runtime] telemetry journal never appeared for ${entry.agentId}; stopping tailer`)
        this.stopTelemetryTailer(entry.agentId)
      }
    }, TAILER_AUTO_STOP_MS)
  }

  private stopTelemetryTailer(agentId: string): void {
    const tailer = this.telemetryTailers.get(agentId)
    if (!tailer) return
    tailer.stop()
    this.telemetryTailers.delete(agentId)
  }

  private handleTelemetryEvent(agentId: string, event: TelemetryWireEvent): void {
    const entry = this.entries.get(agentId)
    if (!entry) return
    if (event.type === 'usage' && event.usage && typeof event.usage === 'object') {
      const next = event.usage as UsageSnapshot
      if (this.usageEquals(entry.usage, next)) return
      entry.usage = next
      this.emitStatus(agentId)
      return
    }
    if (event.type === 'context') {
      const tokens = typeof event.tokens === 'number' ? event.tokens : null
      // Pi may legitimately return contextWindow = 0 for a freshly-loaded
      // model whose registry entry is missing or unknown. Don't drop the
      // snapshot — the renderer falls back through selectedContextWindow →
      // activeModelContextWindow → contextUsage.contextWindow.
      const contextWindow = typeof event.contextWindow === 'number' ? event.contextWindow : 0
      const percent = typeof event.percent === 'number' ? event.percent : null
      const next: ContextSnapshot = { tokens, contextWindow, percent }
      if (this.contextUsageEquals(entry.contextUsage, next)) return
      entry.contextUsage = next
      this.emitStatus(agentId)
      return
    }
    if (event.type === 'models' && Array.isArray(event.models)) {
      const next = event.models as ModelInfo[]
      if (this.modelsEqual(entry.availableModels, next)) return
      entry.availableModels = next
      this.emitStatus(agentId)
      return
    }
    if (event.type === 'model') {
      const contextWindow =
        typeof event.contextWindow === 'number' && event.contextWindow > 0
          ? event.contextWindow
          : undefined
      const name = typeof event.name === 'string' ? event.name : undefined
      if (entry.activeModelContextWindow === contextWindow && entry.activeModelName === name) return
      entry.activeModelContextWindow = contextWindow
      entry.activeModelName = name
      this.emitStatus(agentId)
      return
    }
    // 'lifecycle' events are recorded but do not change UI state.
  }

  private usageEquals(a: UsageSnapshot | undefined, b: UsageSnapshot): boolean {
    if (!a) return false
    return (
      a.input === b.input &&
      a.output === b.output &&
      a.cacheRead === b.cacheRead &&
      a.cacheWrite === b.cacheWrite &&
      a.totalTokens === b.totalTokens
    )
  }

  private contextUsageEquals(a: ContextSnapshot | undefined, b: ContextSnapshot): boolean {
    if (!a) return false
    return (
      a.tokens === b.tokens &&
      a.contextWindow === b.contextWindow &&
      a.percent === b.percent
    )
  }

  private modelsEqual(a: ModelInfo[] | undefined, b: ModelInfo[]): boolean {
    if (!a) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      const x = a[i]
      const y = b[i]
      if (!x || !y) return false
      if (
        x.provider !== y.provider ||
        x.id !== y.id ||
        x.name !== y.name ||
        x.contextWindow !== y.contextWindow ||
        x.maxTokens !== y.maxTokens
      ) {
        return false
      }
    }
    return true
  }

  // ============================================================
  // PROCESS MANAGEMENT
  // ============================================================

  private spawnProcess(entry: RuntimeEntry): void {
    const { agentId, agentDir, manifestPiSource } = entry
    const agentSh = join(agentDir, 'agent.sh')
    const piDir = join(manifestPiSource, 'pi')

    log.info(`[runtime] spawning ${agentSh} (PI_DIR=${piDir})`)

    let proc: ChildProcess
    try {
      proc = spawn('/bin/bash', [agentSh, '--mode', 'rpc', '--no-session'], {
        cwd: agentDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PI_DIR: piDir,
          AGENT_DIR: agentDir,
          PI_AGENT_DIR: agentDir,
          // Diagnostic knob: when set, the telemetry extension writes
          // every handler route + journal-path decision to stderr.
          SUPERHIVE_TELEMETRY_DEBUG:
            process.env.SUPERHIVE_TELEMETRY_DEBUG ?? '0',
        },
      })
    } catch (err) {
      log.error(`[runtime] spawn failed for ${agentId}:`, err)
      entry.lastError = err instanceof Error ? err.message : String(err)
      this.transitionStatus(entry, 'error')
      return
    }

    entry.process = proc
    entry.pid = proc.pid
    this.readyEmitted.delete(agentId)
    this.resetSilenceTimer(entry)

    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
      log.debug(`[runtime.stdout] agent=${agentId} len=${chunk.length} preview=${JSON.stringify(preview)}`)
      entry.adapter.onStdout(text, (ev) => this.handleAdapterEvent(agentId, ev))
      this.resetSilenceTimer(entry)
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        entry.stderrLog.push(trimmed)
        if (entry.stderrLog.length > STDERR_LOG_LIMIT) {
          entry.stderrLog.shift()
        }
        // Promote any extension-load failure lines to warn level so
        // they show up in main.log without requiring debug logging.
        // Pi's loader catches extension exceptions and returns them in
        // LoadExtensionsResult.errors, but the agent harness swallows
        // that — extension authors write to stderr (or stdout) instead,
        // and we want those visible.
        if (
          /Failed to load extension/i.test(trimmed) ||
          /Cannot find module/i.test(trimmed) ||
          /SyntaxError|TypeError|TSError/.test(trimmed) ||
          /\b(superhive-pi-truth|superhive-pi-telemetry)\b/.test(trimmed) &&
            /failed|error|missing/i.test(trimmed)
        ) {
          log.warn(`[runtime.extension-load-error] agent=${agentId} ${trimmed}`)
        }
      }
      const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
      log.debug(`[runtime.stderr] agent=${agentId} len=${chunk.length} preview=${JSON.stringify(preview)}`)
      entry.adapter.onStderr(text, (ev) => this.handleAdapterEvent(agentId, ev))
      this.resetSilenceTimer(entry)
    })

    proc.on('exit', (code, signal) => {
      log.info(`[runtime] agent ${agentId} exited code=${code} signal=${signal}`)
      this.clearSilenceTimer(agentId)
      entry.process = null
      entry.pid = undefined
      entry.endedAt = Date.now()
      if (code === 0 || signal === 'SIGTERM' || signal === 'SIGKILL') {
        this.transitionStatus(entry, 'stopped')
      } else {
        entry.lastError = entry.stderrLog.slice(-3).join(' | ') || `Process exited with code ${code}`
        this.transitionStatus(entry, 'error')
      }
      this.emitStatus(agentId)
      this.sendExitEvent(agentId, code, signal)
    })

    proc.on('error', (err) => {
      log.error(`[runtime] agent ${agentId} error:`, err)
      entry.lastError = err.message
      this.transitionStatus(entry, 'error')
    })
  }

  private terminateProcess(proc: ChildProcess): void {
    try {
      proc.stdin?.write(JSON.stringify({ type: 'abort' }) + '\n')
    } catch {}
    try {
      proc.stdin?.end()
    } catch {}
  }

  // ============================================================
  // STATUS STATE MACHINE
  // ============================================================

  private transitionStatus(entry: RuntimeEntry, next: AgentStatus, reason?: string): void {
    const prev = entry.status
    if (prev === next) return
    entry.status = next
    log.debug(
      `[runtime.status] agent=${entry.agentId} ${prev} → ${next}${reason ? ` (${reason})` : ''}`
    )
    this.emitStatus(entry.agentId)
    this.persistStatus(entry)
  }

  private persistStatus(entry: RuntimeEntry): void {
    AgentRepository.update(entry.agentId, {
      status: entry.status,
      lastError: entry.lastError,
    }).catch((err) => {
      log.warn(`[runtime] failed to persist status for ${entry.agentId}:`, err)
    })
  }

  // ============================================================
  // EVENT BROADCAST
  // ============================================================

  private handleAdapterEvent(agentId: string, event: AdapterEvent): void {
    const entry = this.entries.get(agentId)
    if (!entry) return

    if (event.type === 'boot-step') {
      entry.bootStep = event.step
      this.emitStatus(agentId)
      return
    }

    if (event.type === 'ready') {
      this.transitionStatus(entry, 'running')
      log.debug(`[runtime.event] agent=${agentId} type=ready`)
      return
    }

    if (event.type === 'message-start') {
      const msg: RuntimeMessage = {
        id: event.messageId,
        role: event.role,
        parts: [],
        ts: Date.now(),
      }
      entry.messages.push(msg)
      entry._chatPending.add(msg.id)
      this.scheduleChatPersist(entry)
      this.transitionStatus(entry, 'busy')
      log.debug(`[runtime.event] agent=${agentId} type=message-start role=${event.role}`)
      this.emitMessages(agentId)
      return
    }

    if (event.type === 'text-delta') {
      const msg = entry.messages.find((m) => m.id === event.messageId)
      if (msg) {
        const last = msg.parts[msg.parts.length - 1]
        if (last && last.type === 'text') {
          msg.parts = [
            ...msg.parts.slice(0, -1),
            { ...last, text: last.text + event.delta, state: 'streaming' },
          ]
        } else {
          msg.parts = [
            ...msg.parts,
            { type: 'text', text: event.delta, state: 'streaming' },
          ]
        }
        this.scheduleChatPersist(entry)
        const preview = event.delta.length > 100 ? event.delta.slice(0, 100) + '...' : event.delta
        log.debug(`[runtime.event] agent=${agentId} type=text-delta delta=${JSON.stringify(preview)}`)
        this.emitEvent(agentId, event)
      }
      return
    }

    if (event.type === 'message-end') {
      const msg = entry.messages.find((m) => m.id === event.messageId)
      if (msg) {
        // Mark any trailing text/thinking parts complete so the renderer
        // stops streaming the caret.
        const parts = msg.parts.map((p, i) => {
          if (i !== msg.parts.length - 1) return p
          if (p.type === 'text') return { ...p, state: 'complete' as const }
          if (p.type === 'thinking') return { ...p, state: 'complete' as const }
          return p
        })
        msg.parts = parts
        this.emitEvent(agentId, event)
      }
      this.transitionStatus(entry, 'running')
      log.debug(`[runtime.event] agent=${agentId} type=message-end`)
      return
    }

    if (event.type === 'thinking-start') {
      const msg = entry.messages.find((m) => m.id === event.messageId)
      if (msg) {
        msg.parts = [...msg.parts, { type: 'thinking', text: '', state: 'streaming' }]
        this.emitEvent(agentId, event)
      }
      return
    }

    if (event.type === 'log') {
      const preview = event.line.length > 200 ? event.line.slice(0, 200) + '...' : event.line
      log.debug(`[runtime.event] agent=${agentId} type=log stream=${event.stream} line=${JSON.stringify(preview)}`)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'error') {
      log.debug(`[runtime.event] agent=${agentId} type=error message=${JSON.stringify(event.message)} recoverable=${event.recoverable}`)
      entry.lastError = event.message
      this.transitionStatus(entry, 'running')
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'usage') {
      if (entry.extensionLoaded) return
      entry.usage = event.usage
      this.emitStatus(agentId)
      return
    }

    const payload = JSON.stringify(event)
    const truncated = payload.length > 300 ? payload.slice(0, 300) + '...' : payload
    log.debug(`[runtime.event] agent=${agentId} ${truncated}`)
    this.emitEvent(agentId, event)
  }

  private getWindow(): BrowserWindow | null {
    return BrowserWindow.getAllWindows()[0] ?? null
  }

  private emitEvent(agentId: string, event: AdapterEvent): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send(IPC.AGENTS.ON_EVENT(agentId), event)
  }

  private emitStatus(agentId: string): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    const entry = this.entries.get(agentId)
    if (!entry) return
    win.webContents.send(IPC.AGENTS.ON_STATUS(agentId), {
      agentId,
      status: entry.status,
      pid: entry.pid,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      lastError: entry.lastError,
      bootStep: entry.bootStep,
      usage: entry.usage,
      contextUsage: entry.contextUsage,
      availableModels: entry.availableModels,
      compaction: entry.compaction,
      retry: entry.retry,
    })
  }

  private emitMessages(agentId: string): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    const entry = this.entries.get(agentId)
    if (!entry) return
    win.webContents.send(IPC.AGENTS.ON_MESSAGES(agentId), entry.messages)
  }

  private sendExitEvent(agentId: string, code: number | null, signal: NodeJS.Signals | null): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    const entry = this.entries.get(agentId)
    win.webContents.send(IPC.AGENTS.ON_EXIT(agentId), {
      agentId,
      code,
      signal,
      status: entry?.status ?? 'stopped',
    })
  }

  // ============================================================
  // READINESS DETECTION
  // ============================================================

  private resetSilenceTimer(entry: RuntimeEntry): void {
    const agentId = entry.agentId
    const existing = this.silenceTimers.get(agentId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => this.maybeEmitReady(agentId), READY_SILENCE_MS)
    this.silenceTimers.set(agentId, timer)
  }

  private clearSilenceTimer(agentId: string): void {
    const existing = this.silenceTimers.get(agentId)
    if (existing) {
      clearTimeout(existing)
      this.silenceTimers.delete(agentId)
    }
  }

  private maybeEmitReady(agentId: string): void {
    this.silenceTimers.delete(agentId)
    if (this.readyEmitted.has(agentId)) return
    const entry = this.entries.get(agentId)
    if (!entry || !entry.process) return
    if (entry.status === 'error' || entry.status === 'stopped') return
    this.readyEmitted.add(agentId)
    entry.bootStep = 'ready'
    entry.status = 'running'
    log.info(`[runtime] agent ${agentId} ready (silence-based)`)
    this.emitStatus(agentId)
    this.emitEvent(agentId, { type: 'boot-step', step: 'ready' })
    this.emitEvent(agentId, { type: 'ready' })
  }
}

export const runtime = new GeneralKaiRuntime()
