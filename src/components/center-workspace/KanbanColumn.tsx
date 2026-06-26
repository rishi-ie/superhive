/**
 * Single kanban column for a ticket status.
 */
import { UniversalTicketCard } from './tickets/UniversalTicketCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { UniversalTicket, UniversalTicketStatus } from '@/data/tickets/store';

type KanbanColumnProps = {
  label: string;
  status: UniversalTicketStatus;
  tickets: UniversalTicket[];
  selectedTicketId?: string | null;
  onTicketSelect?: (id: string) => void;
};

/**
 * @param label - Column display label
 * @param status - Ticket status this column represents
 * @param tickets - Tickets to display in this column
 * @param selectedTicketId - Currently selected ticket ID
 * @param onTicketSelect - Called when a ticket is selected
 */
export function KanbanColumn({ label, tickets, selectedTicketId, onTicketSelect }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[240px] w-[260px] shrink-0 h-full">
      <div className="flex items-center gap-1.5 px-1 shrink-0">
        <SectionLabel>{label}</SectionLabel>
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