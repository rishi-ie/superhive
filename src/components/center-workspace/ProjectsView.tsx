import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import {
  getProjectTitle,
  listTickets,
  listProjectAgents,
  listChannels,
} from '@/data/projects/store';

export function ProjectsView() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{getProjectTitle()}</h1>
      <ExecutionStream tickets={listTickets()} agents={listProjectAgents()} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={listProjectAgents()} />
        <Communications channels={listChannels()} agents={listProjectAgents()} />
      </div>
    </div>
  );
}
