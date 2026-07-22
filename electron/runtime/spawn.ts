/**
 * Process lifecycle for the live Pi runtime.
 *
 * Scaffold-only stub. Filled in by the runtime split commit
 * (`refactor(electron): split general-kai-runtime.ts into 6 modules`).
 * The orchestrator class still owns all behavior; this file exists only
 * to lock in the new module's public surface.
 */
import type { GeneralKaiRuntime } from '../general-kai-runtime'
import type { AssistantMessage } from '../../src/models/assistant-message'
import type { ChildProcess } from 'node:child_process'
import type { RuntimeEntry } from '../runtime-status'

export function start(
  _rt: GeneralKaiRuntime,
  _agentId: string,
  _agentDir: string,
  _manifestPiSource: string,
): Promise<void> {
  throw new Error('not_implemented')
}

export function stop(_rt: GeneralKaiRuntime, _agentId: string): void {
  throw new Error('not_implemented')
}

export function restart(_rt: GeneralKaiRuntime, _agentId: string): void {
  throw new Error('not_implemented')
}

export function send(_rt: GeneralKaiRuntime, _agentId: string, _text: string): boolean {
  throw new Error('not_implemented')
}

export function shutdownAll(_rt: GeneralKaiRuntime): Promise<void> {
  throw new Error('not_implemented')
}

export function pruneStaleEntries(_rt: GeneralKaiRuntime): void {
  throw new Error('not_implemented')
}

export function removeEntry(_rt: GeneralKaiRuntime, _agentId: string): void {
  throw new Error('not_implemented')
}

export function spawnProcess(_rt: GeneralKaiRuntime, _entry: RuntimeEntry): void {
  throw new Error('not_implemented')
}

export function terminateProcess(_rt: GeneralKaiRuntime, _proc: ChildProcess): void {
  throw new Error('not_implemented')
}

export type { AssistantMessage }
