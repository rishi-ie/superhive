/**
 * Workspace kanban dashboard: execution stream, swarm roster, and communications grid.
 */
import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { Layers } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import {
  getProjectTitle,
  listTickets,
  listProjectAgents,
  listChannels,
} from '@/data/projects/store';

type ProjectsViewProps = {
  workspaceId: string;
  projectId?: string;
  onTicketSelect?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
  onOpenTickets?: () => void;
};

/**
 * @param workspaceId - Current workspace ID
 * @param projectId - Optional selected project ID
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentClick - Called when an agent is clicked
 * @param onChannelClick - Called when a channel is clicked
 * @param onOpenTickets - Called when "open tickets" is clicked
 */
export function ProjectsView({ workspaceId, projectId, onTicketSelect, onAgentClick, onChannelClick, onOpenTickets }: ProjectsViewProps) {
  const title = projectId ? getProjectTitle(workspaceId) : getProjectTitle(workspaceId);

  if (!title) {
    return (
      <EmptyState
        icon={<Layers size={32} strokeWidth={STROKE_WIDTH} />}
        title="No projects yet"
        description="Projects are containers for tickets, agents, and communications"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <ExecutionStream tickets={listTickets(workspaceId)} agents={listProjectAgents(workspaceId)} onTicketSelect={onTicketSelect} onOpenTickets={onOpenTickets} />
      <div className="grid grid-cols-2 gap-4">
        <SwarmRoster agents={listProjectAgents(workspaceId)} onAgentClick={onAgentClick} onTicketClick={onTicketSelect} />
        <Communications channels={listChannels(workspaceId)} agents={listProjectAgents(workspaceId)} onChannelClick={onChannelClick} onParticipantClick={onAgentClick} onTicketClick={onTicketSelect} />
      </div>
    </div>
  );
}
