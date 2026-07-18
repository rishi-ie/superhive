/**
 * Tests for the pure `revealProjectInFinder` helper.
 *
 * Pins the contract: the caller passes an opaque `projectId`. The helper
 * resolves the local path strictly from `ProjectRepository.getById`,
 * validates the folder still exists, and hands it to
 * `shell.showItemInFolder`. No raw paths cross the trust boundary.
 *
 * The IPC handler in `projects.ts` is a one-line wrapper, so the helper
 * test covers the contract.
 *
 * Run via `bun test electron/ipc/reveal-project.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tmp = join(tmpdir(), `reveal-project-${Date.now()}-${Math.random().toString(36).slice(2)}`)
mkdirSync(tmp, { recursive: true })

const showItemCalls: string[] = []
let lookup: (id: string) => unknown = () => undefined

mock.module('electron', () => ({
  shell: {
    showItemInFolder: (path: string) => {
      showItemCalls.push(path)
    },
  },
}))

mock.module('../../src/storage/repositories/ProjectRepository', () => ({
  ProjectRepository: {
    getById: (id: string) => lookup(id),
  },
}))

const { revealProjectInFinder } = await import('./reveal-project')

afterEach(() => {
  if (existsSync(tmp)) {
    rmSync(tmp, { recursive: true, force: true })
  }
  mkdirSync(tmp, { recursive: true })
  showItemCalls.length = 0
  lookup = () => undefined
})

beforeEach(() => {
  showItemCalls.length = 0
  lookup = () => undefined
})

describe('revealProjectInFinder', () => {
  test('throws when projectId is missing', async () => {
    await expect(revealProjectInFinder('')).rejects.toThrow('Project id is required')
    expect(showItemCalls).toEqual([])
  })

  test('throws when project is not found', async () => {
    lookup = () => undefined
    await expect(revealProjectInFinder('missing')).rejects.toThrow('Project not found or has no folder')
    expect(showItemCalls).toEqual([])
  })

  test('throws when project has no localPath', async () => {
    lookup = () => ({ id: 'p1' })
    await expect(revealProjectInFinder('p1')).rejects.toThrow('Project not found or has no folder')
    expect(showItemCalls).toEqual([])
  })

  test('throws when the folder no longer exists on disk', async () => {
    lookup = () => ({ id: 'p1', localPath: '/definitely/does/not/exist/proj-p1' })
    await expect(revealProjectInFinder('p1')).rejects.toThrow('Project folder no longer exists')
    expect(showItemCalls).toEqual([])
  })

  test('reaches shell.showItemInFolder with the trusted localPath', async () => {
    const projectDir = join(tmp, 'proj-p1')
    mkdirSync(projectDir, { recursive: true })
    lookup = () => ({ id: 'p1', localPath: projectDir })

    const result = await revealProjectInFinder('p1')
    expect(result).toEqual({ ok: true })
    expect(showItemCalls).toEqual([projectDir])
  })
})
