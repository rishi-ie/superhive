import * as React from 'react';
import { listAgents } from '@/flows/agents/crud/list-agents';
import type { Agent } from '@/types/electron';
import { PinnedSection } from './sections/PinnedSection';
import { AgentsSection } from './sections/AgentsSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { ChannelsSection } from './sections/ChannelsSection';

const pinned: { id: string; name: string }[] = [];
const projects: { id: string; name: string }[] = [];
const channels: { id: string; name: string }[] = [];

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
      <AgentsSection items={agents} />
      <ProjectsSection items={projects} />
      <ChannelsSection items={channels} />
    </div>
  );
}