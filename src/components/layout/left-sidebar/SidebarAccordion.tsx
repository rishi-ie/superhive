import * as React from 'react';
import { listAgents } from '@/flows/agents/crud/list-agents';
import type { Agent } from '@/types/electron';
import { PinnedSection } from './sections/PinnedSection';
import { ProjectsSection } from './sections/ProjectsSection';

const pinned: { id: string; name: string }[] = [];

const mockProjects = [
  { id: 'p_boros', name: 'BOROS Architecture', agentIds: [] as string[] },
  { id: 'p_hive', name: 'Meta Hive Strategy', agentIds: [] as string[] },
];

export function SidebarAccordion() {
  const [agents, setAgents] = React.useState<Agent[]>([]);

  React.useEffect(() => {
    let mounted = true;
    listAgents().then((list) => {
      if (mounted) setAgents(list);
    });
    const interval = setInterval(() => {
      listAgents().then((list) => {
        if (mounted) setAgents(list);
      });
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1 px-2">
      <PinnedSection items={pinned} />
      <ProjectsSection items={mockProjects} agents={agents} />
    </div>
  );
}
