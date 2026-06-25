/**
 * Compact ticket card for project execution stream.
 */
import { Avatar } from '@/components/ui/Avatar';
import type { Ticket, ProjectAgent } from '@/data/projects/store';

type TicketCardProps = {
  ticket: Ticket;
  agent?: ProjectAgent;
  onClick?: () => void;
};

/**
 * @param ticket - Ticket to display
 * @param agent - Assigned agent (optional)
 * @param onClick - Called when card is clicked
 */
export function TicketCard({ ticket, agent, onClick }: TicketCardProps) {
  const isExecuting = ticket.status === 'EXECUTING';

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col gap-1.5 p-2 rounded-md border bg-card text-left
        hover:bg-card/80 transition-colors w-full
        ${isExecuting ? 'border-l-2 border-l-chart-1 border-border' : 'border-border'}
      `}
    >
      <span className="text-[9px] font-fustat text-muted-foreground/80 bg-secondary/80 rounded px-1 py-0.5 w-fit">
        {ticket.id}
      </span>
      <span
        className="text-xs font-semibold text-foreground truncate leading-tight"
        title={ticket.title}
      >
        {ticket.title}
      </span>
      {agent && (
        <div className="flex items-center justify-end pt-0.5">
          <Avatar size="xs" fallback={agent.initials} />
        </div>
      )}
    </button>
  );
}