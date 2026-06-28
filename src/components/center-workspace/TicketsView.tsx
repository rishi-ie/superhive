/**
 * Workspace-wide ticket kanban with search, sort, and workspace filter.
 */
import { useMemo, useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { ClipboardCheck } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SearchBar } from '@/components/ui/SearchBar';
import { NewButton } from '@/components/ui/NewButton';
import { Select } from '@/components/ui/Select';
import { listUniversalTickets } from '@/data/tickets/store';
import type { UniversalTicketStatus, Priority } from '@/data/tickets/store';

type SortKey = 'status' | 'priority' | 'recent';

const STATUS_ORDER: Record<UniversalTicketStatus, number> = {
  BACKLOG: 0,
  EXECUTING: 1,
  REVIEW: 2,
  MERGED: 3,
};

const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

type TicketsViewProps = {
  workspaceId: string;
  selectedTicketId?: string | null;
  onTicketSelect?: (id: string) => void;
  onCreateTicket?: () => void;
};

/**
 * @param workspaceId - Current workspace ID
 * @param selectedTicketId - Currently selected ticket ID
 * @param onTicketSelect - Called when a ticket is selected
 * @param onCreateTicket - Called when "New Ticket" is clicked
 */
export function TicketsView({ workspaceId, selectedTicketId, onTicketSelect, onCreateTicket }: TicketsViewProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('status');

  const tickets = listUniversalTickets(workspaceId);

  const filtered = useMemo(() => {
    let result = tickets;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.assignee.name.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (sort === 'recent') {
        return b.id.localeCompare(a.id);
      }
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    });
  }, [tickets, query, sort]);

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={32} strokeWidth={STROKE_WIDTH} />}
        title="No tickets yet"
        description="Tickets break work into trackable units for the swarm"
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0">
        <h1 className="text-base font-bold text-foreground">All Tickets</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} in this workspace
        </p>
      </div>

      <div className="px-6 pb-3 flex items-center gap-3 shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tickets..."
          className="flex-1"
        />
        <Select
          value={sort}
          options={[
            { value: 'status', label: 'Sort: Status' },
            { value: 'priority', label: 'Sort: Priority' },
            { value: 'recent', label: 'Sort: Recent' },
          ]}
          onChange={v => setSort(v as SortKey)}
          className="w-32"
        />
        <NewButton label="New Ticket" onClick={onCreateTicket} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard tickets={filtered} selectedTicketId={selectedTicketId} onTicketSelect={onTicketSelect} />
      </div>
    </div>
  );
}
