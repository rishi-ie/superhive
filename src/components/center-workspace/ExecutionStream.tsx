import { TicketCard } from './TicketCard';
import type { tickets as TicketsType, projectAgents as ProjectAgentsType } from '@/data/mock/project';

type ExecutionStreamProps = {
  tickets: typeof TicketsType;
  agents: typeof ProjectAgentsType;
};

const VISIBLE_LIMIT = 2;

const columns: { status: 'TODO' | 'EXECUTING' | 'DONE'; label: string }[] = [
  { status: 'TODO',      label: 'To Do' },
  { status: 'EXECUTING', label: 'Executing' },
  { status: 'DONE',      label: 'Done' },
];

function getAgentById(agents: typeof ProjectAgentsType, id: string) {
  return agents.find(a => a.id === id);
}

export function ExecutionStream({ tickets, agents }: ExecutionStreamProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {columns.map(col => {
        const colTickets = tickets.filter(t => t.status === col.status);
        const visible = colTickets.slice(0, VISIBLE_LIMIT);
        const overflow = colTickets.length - visible.length;

        return (
          <div key={col.status} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              <span className="text-[9px] font-fustat text-muted-foreground/60 bg-secondary/80 rounded-full px-1.5 py-0.5">
                {colTickets.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {visible.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  agent={getAgentById(agents, ticket.assignedAgentId)}
                />
              ))}
              {overflow > 0 && (
                <button className="text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors text-center py-1 rounded border border-dashed border-border/60 hover:border-border/80">
                  + {overflow} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}