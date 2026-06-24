import { UniversalTicketCard } from './UniversalTicketCard';
import type { UniversalTicket, UniversalTicketStatus } from '@/data/tickets/store';

type KanbanColumnProps = {
  label: string;
  status: UniversalTicketStatus;
  tickets: UniversalTicket[];
  selectedTicketId?: string | null;
  onTicketSelect?: (id: string) => void;
};

export function KanbanColumn({ label, status, tickets, selectedTicketId, onTicketSelect }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[240px] w-[260px] shrink-0 h-full">
      <div className="flex items-center gap-1.5 px-1 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[9px] font-fustat text-muted-foreground/60 bg-secondary/80 rounded-full px-1.5 py-0.5">
          {tickets.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-2 pb-1">
          {tickets.map((ticket) => (
            <UniversalTicketCard
              key={ticket.id}
              ticket={ticket}
              selected={selectedTicketId === ticket.id}
              onClick={onTicketSelect ? () => onTicketSelect(ticket.id) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}