import { PinnedSection } from './sections/PinnedSection';
import { AgentsSection } from './sections/AgentsSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { ChannelsSection } from './sections/ChannelsSection';

const pinned: { id: string; name: string }[] = [];
const agents: { id: string; name: string }[] = [];
const projects: { id: string; name: string }[] = [];
const channels: { id: string; name: string }[] = [];

export function SidebarAccordion() {
  return (
    <div className="flex flex-col gap-1 px-2">
      <PinnedSection items={pinned} />
      <AgentsSection items={agents} />
      <ProjectsSection items={projects} />
      <ChannelsSection items={channels} />
    </div>
  );
}
