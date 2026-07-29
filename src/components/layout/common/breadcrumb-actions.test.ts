import { describe, expect, test } from 'bun:test'
import type { Agent, Project } from '@/types/electron'
import {
  deriveAgentBreadcrumbRelations,
  deriveProjectBreadcrumbUtilities,
} from './breadcrumb-actions'

function project(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    name: id,
    archived: false,
    agentIds: [],
    taskIds: [],
    childProjectIds: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function agent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'Agent',
    status: 'idle',
    projectIds: [],
    taskIds: [],
    sessionIds: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('breadcrumb actions', () => {
  test('derives available and assigned projects for a standard agent', () => {
    const projects = [
      project('assigned'),
      project('available'),
      project('archived', { archived: true }),
    ]

    const unassigned = deriveAgentBreadcrumbRelations(agent(), projects)
    expect(unassigned.assignedProjects).toEqual([])
    expect(unassigned.availableProjects.map((item) => item.id)).toEqual([
      'assigned',
      'available',
    ])
    expect(unassigned.canReveal).toBe(false)

    const assigned = deriveAgentBreadcrumbRelations(
      agent({ projectIds: ['assigned'], localPath: '/tmp/agent' }),
      projects,
    )
    expect(assigned.assignedProjects.map((item) => item.id)).toEqual(['assigned'])
    expect(assigned.availableProjects.map((item) => item.id)).toEqual(['available'])
    expect(assigned.canReveal).toBe(true)
  })

  test('preserves every removal target for a multi-project agent', () => {
    const relations = deriveAgentBreadcrumbRelations(
      agent({ projectIds: ['one', 'two'] }),
      [project('one'), project('two'), project('three')],
    )

    expect(relations.assignedProjects.map((item) => item.id)).toEqual(['one', 'two'])
    expect(relations.availableProjects.map((item) => item.id)).toEqual(['three'])
  })

  test('resolves the owning project for a coordinator', () => {
    const relations = deriveAgentBreadcrumbRelations(
      agent({ agentKind: 'project-coordinator', projectIds: ['project-1'] }),
      [project('project-1')],
    )

    expect(relations.ownerProject?.id).toBe('project-1')
  })

  test('derives project pin and reveal states', () => {
    const hiddenFolder = project('project-1')
    expect(deriveProjectBreadcrumbUtilities(hiddenFolder, [])).toEqual({
      pinned: false,
      canReveal: false,
    })
    expect(
      deriveProjectBreadcrumbUtilities(
        { ...hiddenFolder, localPath: '/tmp/project' },
        ['project-1'],
      ),
    ).toEqual({
      pinned: true,
      canReveal: true,
    })
  })
})
