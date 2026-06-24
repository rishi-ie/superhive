import { Avatar } from '@/components/ui/Avatar';
import type { Priority, TicketType, UniversalTicket } from '@/data/tickets/store';

type UniversalTicketCardProps = {
  ticket: UniversalTicket;
  selected?: boolean;
  onClick?: () => void;
};

function PriorityTag({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    HIGH:   { label: 'HIGH',   className: 'bg-chart-5/15 text-chart-5 border-chart-5/40' },
    MEDIUM: { label: 'MEDIUM', className: 'bg-chart-3/15 text-chart-3 border-chart-3/40' },
    LOW:    { label: 'LOW',    className: 'bg-secondary/40 text-muted-foreground border-border' },
  };
  const cfg = config[priority];
  return (
    <span className={`inline-flex items-center text-[9px] font-medium uppercase tracking-wider rounded border px-1.5 py-0.5 ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function TypeTag({ type }: { type: TicketType }) {
  const labels: Record<TicketType, string> = { BUG: 'Bug', FEATURE: 'Feature', REFACTOR: 'Refactor' };
  return (
    <span className="inline-flex items-center text-[9px] font-medium text-muted-foreground rounded border border-border bg-secondary/40 px-1.5 py-0.5">
      {labels[type]}
    </span>
  );
}

export function UniversalTicketCard({ ticket, selected, onClick }: UniversalTicketCardProps) {
  const isExecuting = ticket.status === 'EXECUTING';
  const initials = ticket.assignee.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <button
      onClick={onClick}
      type="button"
      className={`
        flex flex-col p-2 rounded-md border bg-card text-left
        hover:bg-card/80 transition-colors w-full
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
          <span className="size-1.5 rounded-full bg-chart-2 pulse-executing shrink-0" aria-label="AI processing" />
        )}
      </div>
    </button>
  );
}