import { Avatar } from '@/components/ui/Avatar';
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { projectAgents as ProjectAgentsType } from '@/data/mock/project';

type SwarmRosterProps = {
  agents: typeof ProjectAgentsType;
};

function AgentCard({ agent }: { agent: typeof ProjectAgentsType[number] }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:border-border/80 transition-colors">
      <Avatar size="xs" fallback={agent.initials} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {agent.currentStatus === 'WORKING' && (
            <span className="size-1.5 rounded-full bg-chart-2 pulse-executing shrink-0" />
          )}
          {agent.currentStatus === 'COMPILING' && (
            <Loader2 size={8} strokeWidth={STROKE_WIDTH} className="shrink-0 animate-spin text-chart-3" />
          )}
          {agent.currentStatus === 'IDLE' && (
            <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
          <span className="text-xs font-semibold text-foreground truncate">{agent.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground truncate">{agent.role}</span>
      </div>
      {agent.assignedTicketId && (
        <span className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded-full px-1.5 py-0.5 shrink-0">
          {agent.assignedTicketId}
        </span>
      )}
    </div>
  );
}

export function SwarmRoster({ agents }: SwarmRosterProps) {
  const activeAgents = agents.filter(a => a.currentStatus !== 'IDLE');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Active Agents
      </span>
      <div className="flex flex-col gap-1.5">
        {activeAgents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}