/**
 * Cross-workspace ticket card with priority, type, and assignee.
 */
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import type { UniversalTicket } from '@/data/tickets/store';
import { PriorityTag } from './PriorityTag';
import { TypeTag } from './TypeTag';

type UniversalTicketCardProps = {
  ticket: UniversalTicket;
  selected?: boolean;
  onClick?: () => void;
};

/**
 * @param ticket - Ticket to display
 * @param selected - Whether card is selected
 * @param onClick - Called when card is clicked
 */
export function UniversalTicketCard({ ticket, selected, onClick }: UniversalTicketCardProps) {
  const isExecuting = ticket.status === 'EXECUTING';
  const initials = ticket.assignee.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <button
      onClick={onClick}
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`
        flex flex-col p-2 rounded-md border bg-card text-left
        hover:bg-card/80 transition-colors w-full cursor-grab active:cursor-grabbing
        ${isExecuting ? 'border-l-2 border-l-chart-1 border-border' : 'border-border'}
        ${selected ? 'bg-muted border-foreground/40' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-1 gap-1">
        <span className="text-[9px] font-medium text-chart-2 bg-chart-2/10 rounded px-1 py-0.5 truncate max-w-[120px]">
          {ticket.projectName}
        </span>
        <span className="text-[9px] font-fustat text-muted-foreground/70 shrink-0">
          {ticket.id}
        </span>
      </div>

      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-2">
        {ticket.title}
      </p>

      <div className="flex items-center gap-1 mb-1.5">
        <PriorityTag priority={ticket.priority} />
        <TypeTag type={ticket.type} />
      </div>

      <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/60">
        <Avatar size="xs" fallback={initials} src={ticket.assignee.avatarUrl} />
        <span className="text-[10px] text-muted-foreground truncate flex-1">{ticket.assignee.name}</span>
        {ticket.assignee.isAI && (
          <StatusDot status="EXECUTING" size="xs" />
        )}
      </div>
    </button>
  );
}
