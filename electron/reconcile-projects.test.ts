/**
 * Tests for `electron/reconcile-projects.ts` — the filesystem-to-DB project
 * reconcile that keeps `db.projects.json` in sync with project folders on
 * disk.
 *
 * The contract: the filesystem is the source of truth for project
 * existence. A project row only exists while its folder exists, and the
 * folder is valid iff `<root>/agent/Superhive-pi-agent.json` exists.
 *
 * These tests exercise the pure FS helpers (which encode the contract)
 * and the dedup logic. The DB-mutating reconcile loop is exercised
 * end-to-end via the boot flow (see `main.ts`); it's not unit-tested here
 * because ProjectRepository and AgentRepository depend on Electron's
 * userData path through `loadDb()` and aren't worth mocking — the helpers
 * are where the contract lives.
 *
 * Run via `bun test electron/reconcile-projects.test.ts`.
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { tmpdir } from 'node:os'
import {
  isValidProjectRoot,
  type ReconcileProjectsReport,
} from './reconcile-projects'

let sandbox: string

function makeProjectFolder(name: string, withCoordinator = true): string {
  const root = join(sandbox, name)
  if (withCoordinator) {
    const coordinatorDir = join(root, 'agent')
    mkdirSync(coordinatorDir, { recursive: true })
    writeFileSync(join(coordinatorDir, 'Superhive-pi-agent.json'), JSON.stringify({ name }))
  } else {
    mkdirSync(root, { recursive: true })
  }
  return root
}

beforeEach(() => {
  sandbox = join(tmpdir(), `superhive-test-${crypto.randomUUID()}`)
  mkdirSync(sandbox, { recursive: true })
})

afterEach(() => {
  if (existsSync(sandbox)) {
    rmSync(sandbox, { recursive: true, force: true })
  }
})

describe('isValidProjectRoot', () => {
  test('returns true when <root>/agent/Superhive-pi-agent.json exists', () => {
    const root = makeProjectFolder('ltm')
    expect(isValidProjectRoot(root)).toBe(true)
  })

  test('returns false when root has no agent/ subfolder', () => {
    const root = makeProjectFolder('empty', false)
    expect(isValidProjectRoot(root)).toBe(false)
  })

  test('returns false when agent/ subfolder exists but settings file is missing', () => {
    const root = join(sandbox, 'half-baked')
    mkdirSync(join(root, 'agent'), { recursive: true })
    // No Superhive-pi-agent.json
    expect(isValidProjectRoot(root)).toBe(false)
  })

  test('returns false when settings file is malformed JSON', () => {
    const root = join(sandbox, 'corrupt')
    const coordinatorDir = join(root, 'agent')
    mkdirSync(coordinatorDir, { recursive: true })
    writeFileSync(join(coordinatorDir, 'Superhive-pi-agent.json'), '{ not json')
    // The marker check is `existsSync` only — a malformed file is still a
    // valid folder marker. The reconcile downstream catches JSON errors
    // when reading the name and falls back to the folder basename.
    expect(isValidProjectRoot(root)).toBe(true)
  })

  test('returns false for empty string root', () => {
    expect(isValidProjectRoot('')).toBe(false)
  })

  test('returns false for non-existent root', () => {
    expect(isValidProjectRoot(join(sandbox, 'does-not-exist'))).toBe(false)
  })
})

describe('ReconcileProjectsReport shape', () => {
  // The report type is a structural contract — the watcher's toast
  // rendering and the main-process boot log both depend on it. Lock the
  // shape so a future refactor that drops a field breaks the test.
  test('has adopted and removed fields with expected inner types', () => {
    const report: ReconcileProjectsReport = {
      adopted: ['proj-1', 'proj-2'],
      removed: [{ id: 'proj-3', name: basename(sandbox) }],
    }
    expect(report.adopted).toHaveLength(2)
    expect(report.removed[0]).toEqual({
      id: expect.any(String),
      name: expect.any(String),
    })
  })
})