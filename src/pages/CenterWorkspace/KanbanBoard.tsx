/**
 * Four-column kanban board (Backlog / Executing / Review / Merged).
 */
import { KanbanColumn } from './KanbanColumn';
import type { UniversalTicket, UniversalTicketStatus } from '@/data/ticket/store';

type KanbanBoardProps = {
  tickets: UniversalTicket[];
  selectedTicketId?: string | null;
  onTicketSelect?: (id: string) => void;
};

const columns: { status: UniversalTicketStatus; label: string }[] = [
  { status: 'BACKLOG',   label: 'Backlog' },
  { status: 'EXECUTING', label: 'Executing' },
  { status: 'REVIEW',    label: 'Awaiting Review' },
  { status: 'MERGED',    label: 'Merged' },
];

/**
 * @param tickets - All tickets to display across columns
 * @param selectedTicketId - Currently selected ticket ID
 * @param onTicketSelect - Called when a ticket is selected
 */
export function KanbanBoard({ tickets, selectedTicketId, onTicketSelect }: KanbanBoardProps) {
  return (
    <div className="flex gap-2 h-full px-3 py-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {columns.map((col) => (
        <KanbanColumn
          key={col.status}
          label={col.label}
          status={col.status}
          tickets={tickets.filter((t) => t.status === col.status)}
          selectedTicketId={selectedTicketId}
          onTicketSelect={onTicketSelect}
        />
      ))}
    </div>
  );
}