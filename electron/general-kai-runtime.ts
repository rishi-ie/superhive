import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import {
  type AdapterEvent,
  type PiProtocolAdapter,
  type UsageSnapshot,
  type ContextSnapshot,
  type ModelInfo,
  RawTextAdapter,
} from './pi-protocol'
import { TelemetryTailer } from './pi-protocol/telemetry-tailer'
import type { AgentStatus } from '../src/storage/types'
import type { RuntimeStatusPayload } from '../src/types/electron'
import type { ChatRow, UserMessage, AssistantMessage } from '../src/models/assistant-message'
import { IPC } from './ipc/index'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { SettingsRepository } from '../src/storage/repositories/SettingsRepository'
import { parseCounter } from './agent-settings-defaults'
import { appendBatch, chatFilePath, readAll, trimTo } from './agent-chat-store'
import { buildStatusPayload } from './runtime-status'
import { AGENT_CHAT_MESSAGE_CAP } from '../src/lib/constants'

/**
 * Live runtime state for one agent instance.
 * Single-threaded JS: all mutations are safe without locks.
 *
 * Canonical type lives in `./runtime-status` so it can be referenced from
 * unit tests without booting Electron. This module imports the type and
 * re-exports it for any external consumer.
 */
export type { RuntimeEntry } from './runtime-status'
import type { RuntimeEntry } from './runtime-status'

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
 *
 * SuperHive Chat Runtime v2 — Phase A scope:
 *   - `entry.messages: ChatRow[]` holds ONLY finalized rows
 *     (`UserMessage | AssistantMessage`). Streaming state never reaches
 *     disk.
 *   - The main process is a pure forwarder for assistant-streaming
 *     events. It does NOT mutate `entry.messages` on streaming events;
 *     the renderer is the sole owner of the in-flight state.
 *   - User messages persist immediately on send.
 *   - Assistant message persistence will be wired in Phase C via the
 *     `agents:persistAssistantMessage` IPC. For Phase A, the IPC
 *     handler is in place but the renderer doesn't fire it yet — the
 *     `finalize-message` op lands in Phase B.
 */
class GeneralKaiRuntime {
  private entries = new Map<string, RuntimeEntry>()
  private adapterFactories = new Map<string, () => PiProtocolAdapter>()
  private silenceTimers = new Map<string, NodeJS.Timeout>()
  private readyEmitted = new Set<string>()
  private settingsWatchers = new Map<string, FSWatcher>()
  private telemetryTailers = new Map<string, TelemetryTailer>()
  private lastSeenCounter = new Map<string, number>()

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
    return buildStatusPayload(entry, agentId)
  }

  listAgents(): string[] {
    return Array.from(this.entries.keys())
  }

  private resolveAgentKindSync(agentId: string): string {
    try {
      const all = AgentRepository.getAllSync()
      const agent = all.find((a) => a.id === agentId)
      return agent?.agentKind ?? 'standard'
    } catch {
      return 'standard'
    }
  }

  isRunning(agentId: string): boolean {
    const entry = this.entries.get(agentId)
    return !!entry?.process && entry.status !== 'idle'
  }

  /** Spawn a new Pi process for an agent. Idempotent — ignored if already running. */
  async start(agentId: string, agentDir: string, manifestPiSource: string): Promise<void> {
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
      status: 'active',
      messages: [],
      stderrLog: [],
      adapter,
      usage: undefined,
      contextUsage: undefined,
      extensionLoaded: false,
      availableModels: undefined,
      _chatPending: new Set(),
      _chatDebounceTimer: null,
      _inFlightTools: new Map(),
    }

    entry.adapter = adapter
    entry.agentDir = agentDir
    entry.manifestPiSource = manifestPiSource
    entry.status = 'active'
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
    entry.activeModelProvider = undefined
    entry.compaction = undefined
    entry.retry = undefined
    entry.stderrLog = []
    entry._chatPending = new Set()
    entry._chatDebounceTimer = null
    entry._inFlightTools = new Map()
    adapter.reset()

    this.entries.set(agentId, entry)

    // Hydrate from disk on start. The disk always holds finalized rows
    // (no streaming state) so this is a plain readAll.
    const persisted = await readAll(chatFilePath(agentDir))
    if (entry.messages.length === 0 && persisted.length > 0) {
      entry.messages = persisted
    }

    this.emitStatus(agentId)
    this.emitMessages(agentId)
    this.spawnProcess(entry)
    if (entry.extensionLoaded) {
      this.startTelemetryTailer(entry)
    } else {
      log.debug(`[runtime] telemetry extension missing for ${agentId}; skipping tailer`)
    }
  }

  /** Send SIGABRT + SIGTERM to the process. Sets status to 'idle'. */
  stop(agentId: string): void {
    this.clearSilenceTimer(agentId)
    this.readyEmitted.delete(agentId)
    const entry = this.entries.get(agentId)
    if (!entry?.process) {
      if (entry) {
        this.transitionStatus(entry, 'idle')
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

  /**
   * Send a user prompt. The user message is persisted immediately
   * (spec: "User Message — Persist immediately"). The runtime then
   * writes the wire envelope to Pi's stdin.
   */
  send(agentId: string, text: string): boolean {
    const entry = this.entries.get(agentId)
    if (!entry?.process) return false
    if (!text.trim()) return false
    const userMsg: UserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      timestamp: Date.now(),
      text,
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
      this.transitionStatus(entry, 'idle')
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
        entry.status = 'idle'
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
  // CHAT PERSISTENCE — only finalized rows reach disk
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
    const rows: ChatRow[] = []
    for (const id of entry._chatPending) {
      const m = entry.messages.find((r) => r.id === id)
      if (m) rows.push(m)
    }
    entry._chatPending.clear()
    if (rows.length === 0) return
    try {
      await appendBatch(chatFilePath(entry.agentDir), rows)
      if (entry.messages.length > AGENT_CHAT_MESSAGE_CAP) {
        trimTo(chatFilePath(entry.agentDir), AGENT_CHAT_MESSAGE_CAP).catch((err) =>
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

  /**
   * Renderer-driven assistant-message persistence. Fired by the slice's
   * `notify` path on every finalized `AssistantMessage` (via
   * `finalize-message`, `set-frozen`, or `append-error`). Replaces the
   * in-flight placeholder by id, queues the row to `_chatPending`, and
   * schedules the debounced flush to chat.jsonl via `appendBatch`.
   *
   * Idempotent — repeated calls with the same id overwrite the in-memory
   * row (e.g. a retried freeze from the 60s safety net).
   */
  persistAssistantMessage(agentId: string, message: AssistantMessage): void {
    const entry = this.entries.get(agentId)
    if (!entry) return
    const idx = entry.messages.findIndex((m) => m.id === message.id)
    if (idx === -1) {
      entry.messages = [...entry.messages, message]
    } else {
      entry.messages = [
        ...entry.messages.slice(0, idx),
        message,
        ...entry.messages.slice(idx + 1),
      ]
    }
    entry._chatPending.add(message.id)
    this.scheduleChatPersist(entry)
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
      const provider = typeof event.provider === 'string' ? event.provider : undefined
      if (
        entry.activeModelContextWindow === contextWindow &&
        entry.activeModelName === name &&
        entry.activeModelProvider === provider
      ) return
      entry.activeModelContextWindow = contextWindow
      entry.activeModelName = name
      entry.activeModelProvider = provider
      this.emitStatus(agentId)
      if (typeof event.provider === 'string' && name && typeof contextWindow === 'number') {
        this.persistModelContextWindow(event.provider, name, contextWindow)
      }
      return
    }
  }

  private async persistModelContextWindow(
    provider: string,
    name: string,
    contextWindow: number,
  ): Promise<void> {
    try {
      const id = `${provider}:${name}`
      const row = await SettingsRepository.getSetting('global', 'global', id)
      if (!row) return
      const value = row.value as { contextWindow?: number } | undefined
      if (typeof value?.contextWindow === 'number' && value.contextWindow > 0) return
      await SettingsRepository.setSetting(
        'global',
        'global',
        id,
        { ...(value ?? {}), id, provider, name, enabled: true, isCustom: true, contextWindow },
        'json',
        name,
        undefined,
        'models',
      )
      const win = this.getWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC.SETTINGS.ON_MODEL_UPDATED, { id, provider, name, contextWindow })
      }
      log.info(`[runtime] auto-resolved contextWindow for ${id} = ${contextWindow}`)
    } catch (err) {
      log.warn(`[runtime] failed to persist model contextWindow for ${provider}:${name}:`, err)
    }
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
          AGENT_KIND: this.resolveAgentKindSync(entry.agentId),
          AGENT_ID: agentId,
          SUPERHIVE_TELEMETRY_DEBUG:
            process.env.SUPERHIVE_TELEMETRY_DEBUG ?? '0',
        },
      })
    } catch (err) {
      log.error(`[runtime] spawn failed for ${agentId}:`, err)
      entry.lastError = err instanceof Error ? err.message : String(err)
      this.transitionStatus(entry, 'idle')
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
        this.transitionStatus(entry, 'idle')
      } else {
        entry.lastError = entry.stderrLog.slice(-3).join(' | ') || `Process exited with code ${code}`
        this.transitionStatus(entry, 'idle')
      }
      this.emitStatus(agentId)
      this.sendExitEvent(agentId, code, signal)
    })

    proc.on('error', (err) => {
      log.error(`[runtime] agent ${agentId} error:`, err)
      entry.lastError = err.message
      this.transitionStatus(entry, 'idle')
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
  // EVENT BROADCAST — pure forwarder for streaming events.
  //
  // Phase A: the main process does NOT mutate `entry.messages` on any
  // streaming event. It only updates status/lastError and forwards the
  // event to the renderer (which is the sole owner of in-flight state).
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
      this.transitionStatus(entry, 'active')
      log.debug(`[runtime.event] agent=${agentId} type=ready`)
      return
    }

    if (event.type === 'message-start') {
      // Phase A: no in-flight placeholder is pushed. The renderer
      // creates its own in-flight state on receipt of this event.
      this.transitionStatus(entry, 'busy')
      log.debug(`[runtime.event] agent=${agentId} type=message-start role=${event.role}`)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'message-end') {
      // Phase A: the finalized AssistantMessage is constructed and
      // pushed by the renderer in Phase B (via the queue's
      // `finalize-message` op + `persistAssistantMessage` IPC in
      // Phase C). For now, just transition status and forward.
      this.transitionStatus(entry, 'active')
      log.debug(`[runtime.event] agent=${agentId} type=message-end`)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'error') {
      log.debug(`[runtime.event] agent=${agentId} type=error message=${JSON.stringify(event.message)} recoverable=${event.recoverable}`)
      entry.lastError = event.message
      this.transitionStatus(entry, 'active')
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'usage') {
      if (entry.extensionLoaded) return
      entry.usage = event.usage
      this.emitStatus(agentId)
      return
    }

    if (event.type === 'compaction-start') {
      entry.compaction = { reason: event.reason, startedAt: Date.now() }
      this.emitStatus(agentId)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'compaction-end') {
      entry.compaction = undefined
      this.emitStatus(agentId)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'auto-retry-start') {
      entry.retry = {
        attempt: event.attempt,
        maxAttempts: event.maxAttempts,
        delayMs: event.delayMs,
        errorMessage: event.errorMessage,
        startedAt: Date.now(),
      }
      this.emitStatus(agentId)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'auto-retry-end') {
      entry.retry = undefined
      this.emitStatus(agentId)
      this.emitEvent(agentId, event)
      return
    }

    // All other streaming events (text-delta, thinking-*,
    // tool-call-*, tool-execution-*, message-start/end,
    // image-attachment, branch-summary, log) — forward only.
    // The renderer is the sole owner of in-flight state.
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
    win.webContents.send(IPC.AGENTS.ON_STATUS(agentId), buildStatusPayload(entry, agentId))
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
      status: entry?.status ?? 'idle',
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
    if (entry.status === 'idle') return
    this.readyEmitted.add(agentId)
    entry.bootStep = 'ready'
    this.transitionStatus(entry, 'active')
    log.info(`[runtime] agent ${agentId} ready (silence-based)`)
    this.emitStatus(agentId)
    this.emitEvent(agentId, { type: 'boot-step', step: 'ready' })
    this.emitEvent(agentId, { type: 'ready' })
  }
}

export const runtime = new GeneralKaiRuntime()
