/**
 * Ticket Inbox tab — related tickets and recent activity for a specific ticket.
 */
import { Ticket } from 'lucide-react';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { listUniversalTickets } from '@/data/tickets/store';
import type { UniversalTicket } from '@/data/tickets/store';

type TicketInboxProps = {
  ticketId: string;
  onTicketClick?: (id: string) => void;
};

/**
 * Ticket Inbox tab — related tickets from the same project.
 * @param ticketId - The ticket id to scope mentions to
 * @param onTicketClick - Called when a related ticket is clicked
 */
export function TicketInbox({ ticketId, onTicketClick }: TicketInboxProps) {
  const allTickets = listUniversalTickets();
  const current = allTickets.find(t => t.id === ticketId);
  if (!current) {
    return (
      <EmptyState
        icon={<Ticket size={28} strokeWidth={1.5} />}
        title="Ticket not found"
        description="This ticket no longer exists"
      />
    );
  }

  const related = allTickets.filter(
    t => t.id !== ticketId && t.projectName === current.projectName,
  );

  if (related.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={28} strokeWidth={1.5} />}
        title="All caught up"
        description="No other tickets in this project"
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Related tickets in {current.projectName}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-2 py-1">
        {related.map(ticket => (
          <RelatedTicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => onTicketClick?.(ticket.id)}
          />
        ))}
      </div>
    </div>
  );
}

type RelatedTicketCardProps = {
  ticket: UniversalTicket;
  onClick: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  BACKLOG:   'text-muted-foreground',
  EXECUTING: 'text-chart-2',
  REVIEW:    'text-chart-3',
  MERGED:    'text-accent',
};

function RelatedTicketCard({ ticket, onClick }: RelatedTicketCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md border border-border bg-card p-2.5 hover:bg-hover-tint transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight line-clamp-1">
            {ticket.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {ticket.assignee.name}
          </p>
        </div>
        <span className={`text-[9px] font-medium uppercase tracking-wider shrink-0 mt-0.5 ${STATUS_COLORS[ticket.status] ?? ''}`}>
          {ticket.status}
        </span>
      </div>
    </button>
  );
}
