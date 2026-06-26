/**
 * Ticket Inbox tab — mentions and comments for a specific ticket.
 */
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { CheckCircle } from 'lucide-react';

type TicketInboxProps = {
  ticketId: string;
};

/**
 * Ticket Inbox tab — mentions and comments for a specific ticket.
 * @param ticketId - The ticket id to scope mentions to
 */
export function TicketInbox(_props: TicketInboxProps) {
  return (
    <EmptyState
      icon={<CheckCircle size={28} strokeWidth={1.5} />}
      title="All caught up"
      description="Nothing needs your attention on this ticket"
    />
  );
}
