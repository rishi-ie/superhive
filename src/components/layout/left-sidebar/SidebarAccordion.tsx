import * as React from 'react';
import { listProjects } from '@/flows/projects/crud/list-projects';
import type { Project } from '@/storage/types';
import { PinnedSection } from './sections/PinnedSection';
import { ProjectsSection } from './sections/ProjectsSection';

const pinned: { id: string; name: string }[] = [];

export function SidebarAccordion() {
  const [projects, setProjects] = React.useState<Project[]>([]);

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
    <div className="flex flex-col gap-1 px-2">
      <PinnedSection items={pinned} />
      <ProjectsSection items={projectItems} />
    </div>
  );
}