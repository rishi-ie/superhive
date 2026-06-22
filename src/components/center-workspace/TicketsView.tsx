import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from './KanbanBoard';
import { STROKE_WIDTH } from '@/lib/constants';
import { listUniversalTickets } from '@/data/tickets/store';

export function TicketsView() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-border px-4 pt-3 shrink-0">
        <h1 className="text-base font-bold text-foreground">All Tickets</h1>
        <Button variant="solid" size="sm">
          <Plus size={14} strokeWidth={STROKE_WIDTH} />
          Add Ticket
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard tickets={listUniversalTickets()} />
      </div>
    </div>
  );
}
