import { expect, test } from 'bun:test'
import {
  getPinnedProjectIds,
  subscribePinnedProjects,
  togglePinnedProject,
} from './use-pinned-projects'

test('notifies same-window subscribers when a project pin changes', () => {
  const id = `test-project-${Date.now()}`
  const snapshots: string[][] = []
  const unsubscribe = subscribePinnedProjects(() => {
    snapshots.push([...getPinnedProjectIds()])
  })

  try {
    togglePinnedProject(id)
    expect(getPinnedProjectIds()).toContain(id)
    expect(snapshots.at(-1)).toContain(id)

    togglePinnedProject(id)
    expect(getPinnedProjectIds()).not.toContain(id)
    expect(snapshots.at(-1)).not.toContain(id)
  } finally {
    if (getPinnedProjectIds().includes(id)) togglePinnedProject(id)
    unsubscribe()
  }
})
