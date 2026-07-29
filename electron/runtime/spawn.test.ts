import { EventEmitter } from 'node:events'
import { expect, test } from 'bun:test'
import type { ChildProcess } from 'node:child_process'
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { RuntimeEntry } from '../runtime-status'
import { abortTurn, invalidateForConfigurationChange } from './spawn'

test('abortTurn sends Pi abort without terminating the ready process', () => {
  const writes: string[] = []
  const process = {
    stdin: { write: (value: string) => writes.push(value) },
  } as unknown as ChildProcess
  const runtime = {
    entries: new Map([['worker-1', { process }]]),
    emitStatus: () => undefined,
  } as unknown as GeneralKaiRuntime

  expect(abortTurn(runtime, 'worker-1')).toBe(true)
  expect(JSON.parse(writes[0]!)).toMatchObject({ type: 'abort' })
  expect(runtime.entries.get('worker-1')?.process).toBe(process)
})

test('configuration invalidation waits for exit, persists idle, and forgets the stale session', async () => {
  const process = new EventEmitter() as ChildProcess
  const entry = {
    agentId: 'worker-1',
    process,
    status: 'busy',
    _chatDebounceTimer: null,
  } as unknown as RuntimeEntry
  const calls: string[] = []
  const entries = new Map([['worker-1', entry]])
  const runtime = {
    entries,
    readyEmitted: new Set(['worker-1']),
    lastSeenCounters: new Map([['worker-1', new Map()]]),
    flushChatEntry: async () => {
      calls.push('flush')
    },
    stop: () => {
      calls.push('stop')
      queueMicrotask(() => process.emit('exit', 0, null))
    },
    transitionStatus: (target: RuntimeEntry, status: RuntimeEntry['status']) => {
      calls.push(`status:${status}`)
      target.status = status
    },
    clearSilenceTimer: () => calls.push('clear-silence'),
    closeSettingsWatcher: () => calls.push('close-watcher'),
    stopTelemetryTailer: () => calls.push('stop-telemetry'),
  } as unknown as GeneralKaiRuntime

  await invalidateForConfigurationChange(runtime, 'worker-1')

  expect(calls.indexOf('flush')).toBeLessThan(calls.indexOf('stop'))
  expect(calls).toContain('status:idle')
  expect(entries.has('worker-1')).toBe(false)
  expect(runtime.readyEmitted.has('worker-1')).toBe(false)
  expect(runtime.lastSeenCounters.has('worker-1')).toBe(false)
})
