import * as React from 'react';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { listProjects } from '@/flows/projects/crud/list-projects';
import { useAgentsListVersion } from '@/stores/agent';
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

  React.useEffect(() => {
    let mounted = true;
    listAgents().then((list) => {
      if (mounted) setAgents(list);
    });
    return () => {
      mounted = false;
    };
  }, [agentsVersion]);

  React.useEffect(() => {
    let mounted = true;
    listProjects().then((list) => {
      if (mounted) setProjects(list);
    });
    const interval = setInterval(() => {
      listProjects().then((list) => {
        if (mounted) setProjects(list);
      });
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const projectItems = projects.map((p) => ({ id: p.id, name: p.name, agentIds: p.agentIds }));

  return (
    <div className="flex flex-col gap-gap-tight px-row">
      <PinnedSection items={pinned} />
      <ProjectsSection items={projectItems} agents={agents} />
    </div>
  );
}