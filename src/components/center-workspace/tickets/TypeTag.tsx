/**
 * Ticket type badge (Bug/Feature/Refactor).
 */
import type { TicketType } from '@/data/tickets/store';

/**
 * @param type - Ticket type to display
 */
export function TypeTag({ type }: { type: TicketType }) {
  const labels: Record<TicketType, string> = { BUG: 'Bug', FEATURE: 'Feature', REFACTOR: 'Refactor' };
  return (
    <span className="inline-flex items-center text-[9px] font-medium text-muted-foreground rounded border border-border bg-secondary/40 px-1.5 py-0.5">
      {labels[type]}
    </span>
  );
}
