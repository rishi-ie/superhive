/**
 * Active agent cards for a project.
 */
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { ProjectAgent } from '@/data/projects/store';

type SwarmRosterProps = {
  agents: ProjectAgent[];
  onAgentClick?: (id: string) => void;
  onTicketClick?: (id: string) => void;
};

function AgentCard({ agent, onAgentClick, onTicketClick }: { agent: ProjectAgent; onAgentClick?: (id: string) => void; onTicketClick?: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:border-border/80 transition-colors">
      <button
        onClick={() => onAgentClick?.(agent.id)}
        className="shrink-0"
        type="button"
      >
        <Avatar size="xs" fallback={agent.initials} />
      </button>
      <button
        onClick={() => onAgentClick?.(agent.id)}
        type="button"
        className="flex-1 min-w-0 flex flex-col gap-0.5 text-left"
      >
        <div className="flex items-center gap-1.5">
          {agent.currentStatus === 'WORKING' && (
            <StatusDot status="EXECUTING" size="xs" />
          )}
          {agent.currentStatus === 'COMPILING' && (
            <Loader2 size={8} strokeWidth={STROKE_WIDTH} className="shrink-0 animate-spin text-chart-3" />
          )}
          {agent.currentStatus === 'IDLE' && (
            <StatusDot status="IDLE" size="xs" />
          )}
          <span className="text-xs font-semibold text-foreground truncate">{agent.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground truncate">{agent.role}</span>
      </button>
      {agent.assignedTicketId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTicketClick?.(agent.assignedTicketId!)}
          className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded-full px-1.5 py-0.5 shrink-0 hover:text-foreground transition-colors"
        >
          {agent.assignedTicketId}
        </Button>
      )}
    </div>
  );
}

/**
 * @param agents - List of project agents to display
 * @param onAgentClick - Called when an agent is clicked
 * @param onTicketClick - Called when an assigned ticket is clicked
 */
export function SwarmRoster({ agents, onAgentClick, onTicketClick }: SwarmRosterProps) {
  const activeAgents = agents.filter(a => a.currentStatus !== 'IDLE');

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel uppercase>
        Active Agents
      </SectionLabel>
      <div className="flex flex-col gap-1.5">
        {activeAgents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onAgentClick={onAgentClick} onTicketClick={onTicketClick} />
        ))}
      </div>
    </div>
  );
}