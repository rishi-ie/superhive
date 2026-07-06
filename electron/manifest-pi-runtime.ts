import { spawn, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import {
  type AdapterEvent,
  type PiProtocolAdapter,
  type InitStep,
  RawTextAdapter,
} from './pi-protocol'
import type { AgentStatus } from '../src/storage/types'
import type { RuntimeStatusPayload } from '../src/types/electron'
import { IPC } from './ipc/index'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'

/**
 * A single message in an in-memory agent conversation.
 * Note: conversations are ephemeral — not persisted to disk or database.
 */
export interface RuntimeMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

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
  // adapter
  adapter: PiProtocolAdapter
}

const STDERR_LOG_LIMIT = 500
const READY_SILENCE_MS = 2000

/**
 * Manages live Pi runtime processes for all agents.
 * Single-threaded JS: all `entries` map mutations are safe without locks.
 */
class ManifestPiRuntime {
  private entries = new Map<string, RuntimeEntry>()
  private adapterFactories = new Map<string, () => PiProtocolAdapter>()
  private silenceTimers = new Map<string, NodeJS.Timeout>()
  private readyEmitted = new Set<string>()

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
    }

    entry.adapter = adapter
    entry.agentDir = agentDir
    entry.manifestPiSource = manifestPiSource
    entry.status = 'initializing'
    entry.startedAt = Date.now()
    entry.endedAt = undefined
    entry.lastError = undefined
    entry.bootStep = undefined
    entry.stderrLog = []
    adapter.reset()

    this.entries.set(agentId, entry)
    this.emitStatus(agentId)
    this.spawnProcess(entry)
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
      content: text,
      ts: Date.now(),
    }
    entry.messages.push(userMsg)
    this.transitionStatus(entry, 'busy')
    this.emitMessages(agentId)
    console.log(`[runtime.send] agent=${agentId} wire=${entry.adapter.serializeInput(text).replace(/\n$/, '')}`)
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

  shutdownAll(): void {
    for (const agentId of Array.from(this.silenceTimers.keys())) {
      this.clearSilenceTimer(agentId)
    }
    this.readyEmitted.clear()
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
  }

  removeEntry(agentId: string): void {
    this.clearSilenceTimer(agentId)
    this.readyEmitted.delete(agentId)
    this.stop(agentId)
    this.entries.delete(agentId)
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
      console.log(`[runtime.stdout] agent=${agentId} len=${chunk.length} preview=${JSON.stringify(preview)}`)
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
      }
      const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
      console.log(`[runtime.stderr] agent=${agentId} len=${chunk.length} preview=${JSON.stringify(preview)}`)
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
    console.log(
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
      console.log(`[runtime.event] agent=${agentId} type=ready`)
      return
    }

    if (event.type === 'message-start') {
      const msg: RuntimeMessage = {
        id: event.messageId,
        role: event.role,
        content: '',
        ts: Date.now(),
      }
      entry.messages.push(msg)
      this.transitionStatus(entry, 'busy')
      console.log(`[runtime.event] agent=${agentId} type=message-start role=${event.role}`)
      this.emitMessages(agentId)
      return
    }

    if (event.type === 'text-delta') {
      const msg = entry.messages.find((m) => m.id === event.messageId)
      if (msg) {
        msg.content += event.delta
        const preview = event.delta.length > 100 ? event.delta.slice(0, 100) + '...' : event.delta
        console.log(`[runtime.event] agent=${agentId} type=text-delta delta=${JSON.stringify(preview)}`)
        this.emitEvent(agentId, event)
      }
      return
    }

    if (event.type === 'message-end') {
      const msg = entry.messages.find((m) => m.id === event.messageId)
      if (msg) {
        this.emitEvent(agentId, event)
      }
      this.transitionStatus(entry, 'running')
      console.log(`[runtime.event] agent=${agentId} type=message-end`)
      return
    }

    if (event.type === 'log') {
      const preview = event.line.length > 200 ? event.line.slice(0, 200) + '...' : event.line
      console.log(`[runtime.event] agent=${agentId} type=log stream=${event.stream} line=${JSON.stringify(preview)}`)
      this.emitEvent(agentId, event)
      return
    }

    if (event.type === 'error') {
      console.log(`[runtime.event] agent=${agentId} type=error message=${JSON.stringify(event.message)} recoverable=${event.recoverable}`)
      entry.lastError = event.message
      this.transitionStatus(entry, 'running')
      this.emitEvent(agentId, event)
      return
    }

    const payload = JSON.stringify(event)
    const truncated = payload.length > 300 ? payload.slice(0, 300) + '...' : payload
    console.log(`[runtime.event] agent=${agentId} ${truncated}`)
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
    this.readyEmitted.add(agentId)
    entry.bootStep = 'ready'
    entry.status = 'running'
    log.info(`[runtime] agent ${agentId} ready (silence-based)`)
    this.emitStatus(agentId)
    this.emitEvent(agentId, { type: 'boot-step', step: 'ready' })
    this.emitEvent(agentId, { type: 'ready' })
  }
}

export const runtime = new ManifestPiRuntime()
