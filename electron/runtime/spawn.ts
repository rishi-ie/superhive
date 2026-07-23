/**
 * Process lifecycle for the live Pi runtime.
 *
 * Owns: spawn (ChildProcess creation), stop (SIGABRT + SIGTERM),
 * restart, send (stdin write), shutdownAll, pruneStaleEntries,
 * removeEntry, spawnProcess, terminateProcess.
 *
 * The orchestrator class (`GeneralKaiRuntime`) holds the `entries`,
 * `telemetryTailers`, `silenceTimers`, `readyEmitted`, `settingsWatchers`
 * Maps. This module mutates them through the `rt` reference passed in.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import log from 'electron-log/main'
import { chatFilePath, readAll } from '../agent-chat-store'
import type { RuntimeEntry } from '../runtime-status'
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { UserMessage } from '../../src/models/assistant-message'
import { RawTextAdapter } from '../pi-protocol'

const STDERR_LOG_LIMIT = 500
const RESTART_DELAY_MS = 800
const SIGTERM_DELAY_MS = 500
const SIGKILL_DELAY_MS = 3000

export async function start(
  rt: GeneralKaiRuntime,
  agentId: string,
  agentDir: string,
  manifestPiSource: string,
): Promise<void> {
  if (rt.isRunning(agentId)) {
    log.info(`[runtime] agent ${agentId} already running, ignoring start`)
    return
  }

  const existing = rt.entries.get(agentId)
  const factory = rt.adapterFactories.get(agentId) ?? (() => new RawTextAdapter())
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

  rt.entries.set(agentId, entry)

  // Hydrate from disk on start. The disk always holds finalized rows
  // (no streaming state) so this is a plain readAll.
  const persisted = await readAll(chatFilePath(agentDir))
  if (entry.messages.length === 0 && persisted.length > 0) {
    entry.messages = persisted
  }

  rt.emitStatus(agentId)
  rt.emitMessages(agentId)
  rt.spawnProcess(entry)
  if (entry.extensionLoaded) {
    rt.startTelemetryTailer(entry)
  } else {
    log.debug(`[runtime] telemetry extension missing for ${agentId}; skipping tailer`)
  }
}

export function stop(rt: GeneralKaiRuntime, agentId: string): void {
  rt.clearSilenceTimer(agentId)
  rt.readyEmitted.delete(agentId)
  const entry = rt.entries.get(agentId)
  if (!entry?.process) {
    if (entry) {
      rt.transitionStatus(entry, 'idle')
    }
    return
  }
  rt.terminateProcess(entry.process)
  setTimeout(() => {
    if (!entry.process?.killed) {
      entry.process?.kill('SIGTERM')
    }
  }, SIGTERM_DELAY_MS)
}

export function restart(rt: GeneralKaiRuntime, agentId: string): void {
  const entry = rt.entries.get(agentId)
  if (!entry) return
  rt.stop(agentId)
  setTimeout(() => rt.start(agentId, entry.agentDir, entry.manifestPiSource), RESTART_DELAY_MS)
}

export function send(rt: GeneralKaiRuntime, agentId: string, text: string): boolean {
  const entry = rt.entries.get(agentId)
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
  rt.scheduleChatPersist(entry)
  rt.transitionStatus(entry, 'busy')
  rt.emitMessages(agentId)
  log.debug(`[runtime.send] agent=${agentId} wire=${entry.adapter.serializeInput(text).replace(/\n$/, '')}`)
  try {
    const wire = entry.adapter.serializeInput(text)
    entry.process.stdin?.write(wire)
    return true
  } catch (err) {
    log.error(`[runtime] send failed for ${agentId}:`, err)
    entry.lastError = err instanceof Error ? err.message : String(err)
    rt.transitionStatus(entry, 'idle')
    return false
  }
}

export async function shutdownAll(rt: GeneralKaiRuntime): Promise<void> {
  rt.closeAllSettingsWatchers()
  for (const agentId of Array.from(rt.silenceTimers.keys())) {
    rt.clearSilenceTimer(agentId)
  }
  rt.readyEmitted.clear()
  for (const agentId of Array.from(rt.telemetryTailers.keys())) {
    rt.stopTelemetryTailer(agentId)
  }
  for (const [, entry] of rt.entries) {
    if (entry.process) {
      rt.terminateProcess(entry.process)
      entry.status = 'idle'
      log.info(`[runtime] shutdown agent ${entry.agentId}`)
    }
  }
  setTimeout(() => {
    for (const [, entry] of rt.entries) {
      if (entry.process && !entry.process.killed) {
        try {
          entry.process.kill('SIGKILL')
        } catch {}
        log.warn(`[runtime] SIGKILL agent ${entry.agentId}`)
      }
    }
  }, SIGKILL_DELAY_MS)
  await rt.flushAllChats()
}

export function pruneStaleEntries(rt: GeneralKaiRuntime): void {
  for (const [id, entry] of rt.entries) {
    if (entry.agentDir && !existsSync(entry.agentDir)) {
      log.info(`[runtime] pruning stale entry for ${id} (folder missing: ${entry.agentDir})`)
      rt.clearSilenceTimer(id)
      rt.readyEmitted.delete(id)
      rt.lastSeenCounters.delete(id)
      rt.stopTelemetryTailer(id)
      if (entry.process) {
        try { entry.process.kill('SIGTERM') } catch { /* ignore */ }
      }
      rt.entries.delete(id)
    }
  }
}

export function removeEntry(rt: GeneralKaiRuntime, agentId: string): void {
  rt.clearSilenceTimer(agentId)
  rt.readyEmitted.delete(agentId)
  rt.closeSettingsWatcher(agentId)
  rt.stopTelemetryTailer(agentId)
  rt.lastSeenCounters.delete(agentId)
  rt.stop(agentId)
  rt.entries.delete(agentId)
}

export function spawnProcess(rt: GeneralKaiRuntime, entry: RuntimeEntry): void {
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
        AGENT_KIND: rt.resolveAgentKindSync(entry.agentId),
        AGENT_ID: agentId,
        SUPERHIVE_TELEMETRY_DEBUG:
          process.env.SUPERHIVE_TELEMETRY_DEBUG ?? '0',
      },
    })
  } catch (err) {
    log.error(`[runtime] spawn failed for ${agentId}:`, err)
    entry.lastError = err instanceof Error ? err.message : String(err)
    rt.transitionStatus(entry, 'idle')
    return
  }

  entry.process = proc
  entry.pid = proc.pid
  rt.readyEmitted.delete(agentId)
  rt.resetSilenceTimer(entry)

  proc.stdout?.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf8')
    const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
    log.debug(`[runtime.stdout] agent=${agentId} len=${chunk.length} preview=${JSON.stringify(preview)}`)
    entry.adapter.onStdout(text, (ev) => rt.handleAdapterEvent(agentId, ev))
    rt.resetSilenceTimer(entry)
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
    entry.adapter.onStderr(text, (ev) => rt.handleAdapterEvent(agentId, ev))
    rt.resetSilenceTimer(entry)
  })

  proc.on('exit', (code, signal) => {
    log.info(`[runtime] agent ${agentId} exited code=${code} signal=${signal}`)
    rt.clearSilenceTimer(agentId)
    entry.process = null
    entry.pid = undefined
    entry.endedAt = Date.now()
    if (code === 0 || signal === 'SIGTERM' || signal === 'SIGKILL') {
      rt.transitionStatus(entry, 'idle')
    } else {
      entry.lastError = entry.stderrLog.slice(-3).join(' | ') || `Process exited with code ${code}`
      rt.transitionStatus(entry, 'idle')
    }
    rt.emitStatus(agentId)
    rt.sendExitEvent(agentId, code, signal)
  })

  proc.on('error', (err) => {
    log.error(`[runtime] agent ${agentId} error:`, err)
    entry.lastError = err.message
    rt.transitionStatus(entry, 'idle')
  })
}

export function terminateProcess(_rt: GeneralKaiRuntime, proc: ChildProcess): void {
  try {
    proc.stdin?.write(JSON.stringify({ type: 'abort' }) + '\n')
  } catch {}
  try {
    proc.stdin?.end()
  } catch {}
}
