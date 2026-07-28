import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowsDownUpIcon, PlusIcon } from '@phosphor-icons/react';
import { Icon } from '@/components/ui/icon';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { listProjects } from '@/flows/projects/crud/list-projects';
import { useAgentsListVersion } from '@/flows/agents/runtime';
import { useAllAgentStatuses } from '@/flows/agents/runtime';
import { useProjectsListVersion } from '@/flows/projects/runtime';
import { useOpenCreateProject } from '@/flows/projects/ui/open-create-project';
import type { Agent } from '@/types/electron';
import type { Project } from '@/storage/types';
import { PinnedSection } from './sections/PinnedSection';
import { ProjectsSection } from './sections/ProjectsSection';

const PINNED_PROJECTS_KEY = 'superhive.sidebar.pinned-project-ids'
const PINNED_AGENTS_KEY = 'superhive.sidebar.pinned-agent-ids'

function loadPinnedProjectIds(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(PINNED_PROJECTS_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

export function SidebarAccordion() {
  const location = useLocation();
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [pinnedProjectIds, setPinnedProjectIds] = React.useState<string[]>(loadPinnedProjectIds);
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(() => new Set());
  const { setOpen: setCreateProjectOpen } = useOpenCreateProject();
  const previousStatuses = React.useRef(new Map<string, string>());
  const currentAgentId = location.pathname.match(/^\/agents\/([^/]+)/)?.[1]
  const currentProjectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1]
  // Bumps whenever db.agents.json is updated by the fs watcher. Drives the
  // agents-list refresh — replaces the previous 5s polling interval.
  const agentsVersion = useAgentsListVersion();
  // Bumps whenever db.projects.json is mutated (assign/unassign agent,
  // create/update/delete project). The main process broadcasts this
  // from the project IPC handlers — no polling fallback needed.
  const projectsVersion = useProjectsListVersion();

  React.useEffect(() => {
    let mounted = true;
    listAgents().then((list) => {
      if (mounted) setAgents(list);
    });
    listProjects().then((list) => {
      if (mounted) setProjects(list);
    });
    return () => {
      mounted = false;
    };
  }, [agentsVersion, projectsVersion]);

  const projectItems = projects.map((p) => ({ id: p.id, name: p.name, agentIds: p.agentIds }));
  const liveStatuses = useAllAgentStatuses(agents.map((agent) => agent.id))
  const workingIds = React.useMemo(() => new Set(
    agents
      .filter((agent) => {
        const status = liveStatuses.get(agent.id)?.status ?? agent.status
        return status === 'busy' || status === 'waiting'
      })
      .map((agent) => agent.id),
  ), [agents, liveStatuses])

  React.useEffect(() => {
    for (const [id, state] of liveStatuses) {
      const previous = previousStatuses.current.get(id)
      const wasWorking = previous === 'busy' || previous === 'waiting'
      const working = state.status === 'busy' || state.status === 'waiting'
      const activeProjectCoordinator = currentProjectId && agents.some((agent) => agent.id === id && agent.agentKind === 'project-coordinator' && agent.projectIds.includes(currentProjectId))
      if (wasWorking && !working && id !== currentAgentId && !activeProjectCoordinator) setCompletedIds((current) => new Set(current).add(id))
      previousStatuses.current.set(id, state.status)
    }
  }, [agents, currentAgentId, currentProjectId, liveStatuses])

  React.useEffect(() => {
    if (!currentAgentId) return
    setCompletedIds((current) => {
      if (!current.has(currentAgentId)) return current
      const next = new Set(current)
      next.delete(currentAgentId)
      return next
    })
  }, [currentAgentId])

  React.useEffect(() => {
    if (!currentProjectId) return
    const coordinatorId = agents.find((agent) => agent.agentKind === 'project-coordinator' && agent.projectIds.includes(currentProjectId))?.id
    if (coordinatorId) openAgent(coordinatorId)
  }, [agents, currentProjectId])

  React.useEffect(() => {
    window.localStorage.removeItem(PINNED_AGENTS_KEY)
    window.localStorage.setItem(PINNED_PROJECTS_KEY, JSON.stringify(pinnedProjectIds))
  }, [pinnedProjectIds])

  const toggleProjectPin = (id: string) => setPinnedProjectIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  const openAgent = (id: string) => setCompletedIds((current) => { const next = new Set(current); next.delete(id); return next })
  const pinnedProjectSet = new Set(pinnedProjectIds)
  const pinnedProjects = projectItems.filter((project) => pinnedProjectSet.has(project.id))
  const unpinnedProjects = projectItems.filter((project) => !pinnedProjectSet.has(project.id))
  const coordinatorStates = new Map(agents.filter((agent) => agent.agentKind === 'project-coordinator').map((agent) => [agent.id, workingIds.has(agent.id) ? 'working' as const : completedIds.has(agent.id) ? 'completed' as const : undefined]).filter((entry): entry is [string, 'working' | 'completed'] => Boolean(entry[1])))

  return (
    <div className="flex flex-col gap-gap-tight px-row">
      <PinnedSection items={pinnedProjects} agents={agents} workingIds={workingIds} completedIds={completedIds} pinnedProjectIds={pinnedProjectSet} coordinatorStates={coordinatorStates} onOpen={openAgent} onToggleProjectPin={toggleProjectPin} />
      <div className="group flex h-8 w-full items-center gap-stack px-row text-sm font-medium text-sidebar-projects-label-fg">
        <span>Projects</span>
        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={() => setCreateProjectOpen(true)} className="flex size-6 cursor-default items-center justify-center rounded-icon text-sidebar-projects-label-fg hover:bg-sidebar-accent-l hover:text-foreground" title="Add project">
            <Icon icon={PlusIcon} className="size-4" />
          </button>
          <button type="button" className="flex size-6 cursor-default items-center justify-center rounded-icon text-sidebar-projects-label-fg hover:bg-sidebar-accent-l hover:text-foreground" title="Reorder projects">
            <Icon icon={ArrowsDownUpIcon} className="size-4" />
          </button>
        </div>
      </div>
      <ProjectsSection items={unpinnedProjects} agents={agents} workingIds={workingIds} completedIds={completedIds} pinnedProjectIds={pinnedProjectSet} coordinatorStates={coordinatorStates} onOpen={openAgent} onToggleProjectPin={toggleProjectPin} />
    </div>
  );
}
