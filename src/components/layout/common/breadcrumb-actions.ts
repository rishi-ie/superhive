import type { Agent, Project } from '@/types/electron'

export function deriveAgentBreadcrumbRelations(agent: Agent, projects: Project[]) {
  const assignedProjects = projects.filter((project) => agent.projectIds.includes(project.id))
  return {
    assignedProjects,
    availableProjects: projects.filter(
      (project) => !project.archived && !agent.projectIds.includes(project.id),
    ),
    ownerProject: agent.agentKind === 'project-coordinator'
      ? assignedProjects[0] ?? null
      : null,
    canReveal: Boolean(agent.localPath),
  }
}

export function deriveProjectBreadcrumbUtilities(
  project: Project,
  pinnedProjectIds: string[],
) {
  return {
    pinned: pinnedProjectIds.includes(project.id),
    canReveal: Boolean(project.localPath),
  }
}
