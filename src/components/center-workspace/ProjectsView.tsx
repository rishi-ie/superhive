import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import {
  projectTitle,
  tickets,
  projectAgents,
  channels,
} from '@/data/mock/project';

export function ProjectsView() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{projectTitle}</h1>
      <ExecutionStream tickets={tickets} agents={projectAgents} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={projectAgents} />
        <Communications channels={channels} agents={projectAgents} />
      </div>
    </div>
  );
}