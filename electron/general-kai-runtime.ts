import type { FSWatcher } from 'node:fs'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import {
  type AdapterEvent,
  type PiProtocolAdapter,
} from './pi-protocol'
import { TelemetryTailer } from './pi-protocol/telemetry-tailer'
import type { RuntimeStatusPayload } from '../src/types/electron'
import type { ChatRow, UserMessage, AssistantMessage } from '../src/models/assistant-message'
import { IPC } from './ipc/index'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { buildStatusPayload } from './runtime-status'
import type { RuntimeEntry } from './runtime-status'
import * as spawnModule from './runtime/spawn'
import * as eventRouter from './runtime/event-router'
import * as telemetryWiring from './runtime/telemetry-wiring'
import * as settingsWatcher from './runtime/settings-watcher'
import type { TruthFileKey } from './runtime/settings-watcher'
import * as chatPersistence from './runtime/chat-persistence'

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
 *
 * Post-split shape: the high-level lifecycle methods on this class are
 * thin delegators to `./runtime/<module>` functions. The Maps and the
 * shared broadcast/state-machine/readiness helpers stay on this class so
 * module functions can mutate them through a single owner.
 */
export class GeneralKaiRuntime {
  /**
   * Mutable runtime state. Internal — touched only by `./runtime/*`
   * module functions. Exposed publicly so module code can read/write
   * without going through a getter/setter pair. Treat as read-only
   * from anywhere else.
   */
  entries = new Map<string, RuntimeEntry>()
  adapterFactories = new Map<string, () => PiProtocolAdapter>()
  silenceTimers = new Map<string, NodeJS.Timeout>()
  readyEmitted = new Set<string>()
  settingsWatchers = new Map<string, FSWatcher>()
  telemetryTailers = new Map<string, TelemetryTailer>()
  /** Per-agent, per-file last-seen writer counters. Replaces the legacy
   *  single-counter map now that the truth layout splits across four
   *  sibling files, each with its own managedBy counter. */
  lastSeenCounters = new Map<string, Map<TruthFileKey, number>>()

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

  resolveAgentKindSync(agentId: string): string {
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
    return spawnModule.start(this, agentId, agentDir, manifestPiSource)
  }

  /** Send SIGABRT + SIGTERM to the process. Sets status to 'idle'. */
  stop(agentId: string): void {
    spawnModule.stop(this, agentId)
  }

  restart(agentId: string): void {
    spawnModule.restart(this, agentId)
  }

  /**
   * Send a user prompt. The user message is persisted immediately
   * (spec: "User Message — Persist immediately"). The runtime then
   * writes the wire envelope to Pi's stdin.
   */
  send(agentId: string, text: string): boolean {
    return spawnModule.send(this, agentId, text)
  }

  async shutdownAll(): Promise<void> {
    await spawnModule.shutdownAll(this)
  }

  /**
   * Drop any runtime entries whose agent folder no longer exists on disk.
   * Run at app startup to avoid wasting spawn attempts on agents whose data
   * was wiped (e.g. via `bun run reset`).
   */
  pruneStaleEntries(): void {
    spawnModule.pruneStaleEntries(this)
  }

  removeEntry(agentId: string): void {
    spawnModule.removeEntry(this, agentId)
  }

  // ============================================================
  // CHAT PERSISTENCE — only finalized rows reach disk
  // ============================================================

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
    chatPersistence.persistAssistantMessage(this, agentId, message)
  }

  async flushAllChats(): Promise<void> {
    await chatPersistence.flushAllChats(this)
  }

  ensureSettingsWatcher(agentId: string, settingsPath: string): void {
    settingsWatcher.ensureSettingsWatcher(this, agentId, settingsPath)
  }

  markSelfWrite(agentId: string, fileKey: TruthFileKey, counter: number): void {
    settingsWatcher.markSelfWrite(this, agentId, fileKey, counter)
  }

  // ============================================================
  // SHARED BROADCAST / STATE-MACHINE / READINESS HELPERS
  //
  // The 5 `./runtime/*` modules call back into these. They live on the
  // class so every module has a single owner for emitting IPC events
  // and for transitioning entry.status.
  // ============================================================

  getWindow(): BrowserWindow | null {
    return BrowserWindow.getAllWindows()[0] ?? null
  }

  emitEvent(agentId: string, event: AdapterEvent): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send(IPC.AGENTS.ON_EVENT(agentId), event)
  }

  emitStatus(agentId: string): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    const entry = this.entries.get(agentId)
    if (!entry) return
    win.webContents.send(IPC.AGENTS.ON_STATUS(agentId), buildStatusPayload(entry, agentId))
  }

  emitMessages(agentId: string): void {
    const win = this.getWindow()
    if (!win || win.isDestroyed()) return
    const entry = this.entries.get(agentId)
    if (!entry) return
    win.webContents.send(IPC.AGENTS.ON_MESSAGES(agentId), entry.messages)
  }

  sendExitEvent(agentId: string, code: number | null, signal: NodeJS.Signals | null): void {
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

  transitionStatus(entry: RuntimeEntry, next: RuntimeEntry['status'], reason?: string): void {
    const prev = entry.status
    if (prev === next) return
    entry.status = next
    log.debug(
      `[runtime.status] agent=${entry.agentId} ${prev} → ${next}${reason ? ` (${reason})` : ''}`
    )
    this.emitStatus(entry.agentId)
    this.persistStatus(entry)
  }

  persistStatus(entry: RuntimeEntry): void {
    AgentRepository.update(entry.agentId, {
      status: entry.status,
      lastError: entry.lastError,
    }).catch((err) => {
      log.warn(`[runtime] failed to persist status for ${entry.agentId}:`, err)
    })
  }

  /**
   * Pass-through helpers — exported so module tests can verify a single
   * module's side-effects without going through the full orchestrator.
   */
  handleAdapterEvent(agentId: string, event: AdapterEvent): void {
    eventRouter.handleAdapterEvent(this, agentId, event)
  }

  handleTelemetryEvent(agentId: string, event: telemetryWiring.TelemetryWireEvent): void {
    telemetryWiring.handleTelemetryEvent(this, agentId, event)
  }

  scheduleChatPersist(entry: RuntimeEntry): void {
    chatPersistence.scheduleChatPersist(this, entry)
  }

  flushChatEntry(entry: RuntimeEntry): Promise<void> {
    return chatPersistence.flushChatEntry(this, entry)
  }

  resetSilenceTimer(entry: RuntimeEntry): void {
    chatPersistence.resetSilenceTimer(this, entry)
  }

  clearSilenceTimer(agentId: string): void {
    chatPersistence.clearSilenceTimer(this, agentId)
  }

  maybeEmitReady(agentId: string): void {
    chatPersistence.maybeEmitReady(this, agentId)
  }

  startTelemetryTailer(entry: RuntimeEntry): void {
    telemetryWiring.startTelemetryTailer(this, entry)
  }

  stopTelemetryTailer(agentId: string): void {
    telemetryWiring.stopTelemetryTailer(this, agentId)
  }

  persistModelContextWindow(provider: string, name: string, contextWindow: number): Promise<void> {
    return telemetryWiring.persistModelContextWindow(this, provider, name, contextWindow)
  }

  usageEquals(a: Parameters<typeof telemetryWiring.usageEquals>[0], b: Parameters<typeof telemetryWiring.usageEquals>[1]): boolean {
    return telemetryWiring.usageEquals(a, b)
  }

  contextUsageEquals(a: Parameters<typeof telemetryWiring.contextUsageEquals>[0], b: Parameters<typeof telemetryWiring.contextUsageEquals>[1]): boolean {
    return telemetryWiring.contextUsageEquals(a, b)
  }

  modelsEqual(a: Parameters<typeof telemetryWiring.modelsEqual>[0], b: Parameters<typeof telemetryWiring.modelsEqual>[1]): boolean {
    return telemetryWiring.modelsEqual(a, b)
  }

  closeSettingsWatcher(agentId: string): void {
    settingsWatcher.closeSettingsWatcher(this, agentId)
  }

  closeAllSettingsWatchers(): void {
    settingsWatcher.closeAllSettingsWatchers(this)
  }

  spawnProcess(entry: RuntimeEntry): void {
    spawnModule.spawnProcess(this, entry)
  }

  terminateProcess(proc: import('node:child_process').ChildProcess): void {
    spawnModule.terminateProcess(this, proc)
  }
}

export const runtime = new GeneralKaiRuntime()

// Quiet the "unused" warning for types referenced only via `import type`.
export type { ChatRow, UserMessage, AssistantMessage }
