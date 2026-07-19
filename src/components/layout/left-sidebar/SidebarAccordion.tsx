import * as React from 'react';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { listProjects } from '@/flows/projects/crud/list-projects';
import { useAgentsListVersion } from '@/flows/agents/runtime';
import { useProjectsListVersion } from '@/flows/projects/runtime';
import type { Agent } from '@/types/electron';
import type { Project } from '@/storage/types';
import { PinnedSection } from './sections/PinnedSection';
import { ProjectsSection } from './sections/ProjectsSection';

const pinned: { id: string; name: string }[] = [];

export function SidebarAccordion() {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
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

  return (
    <div className="flex flex-col gap-gap-tight px-row">
      <PinnedSection items={pinned} />
      <ProjectsSection items={projectItems} agents={agents} />
    </div>
  );
}