import { useMemo, useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { OnboardingWizard } from './OnboardingWizard';
import { SearchBar } from '@/components/ui/SearchBar';
import { NewButton } from '@/components/ui/NewButton';
import { TICKETS_WIZARD_CONFIG } from '@/data/wizard-configs';
import { listUniversalTickets } from '@/data/tickets/store';
import type { UniversalTicket, UniversalTicketStatus, Priority } from '@/data/tickets/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

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
  onAction?: OnboardingWizardProps['onAction'];
};

export function TicketsView({ workspaceId, selectedTicketId, onTicketSelect, onAction }: TicketsViewProps) {
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
      <OnboardingWizard
        config={TICKETS_WIZARD_CONFIG}
        onAction={onAction}
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
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-input px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="status">Sort: Status</option>
          <option value="priority">Sort: Priority</option>
          <option value="recent">Sort: Recent</option>
        </select>
        <NewButton label="New Ticket" />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard tickets={filtered} selectedTicketId={selectedTicketId} onTicketSelect={onTicketSelect} />
      </div>
    </div>
  );
}
