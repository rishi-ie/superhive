import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from './KanbanBoard';
import { OnboardingWizard } from './OnboardingWizard';
import { TICKETS_WIZARD_CONFIG } from '@/data/wizard-configs';
import { STROKE_WIDTH } from '@/lib/constants';
import { listUniversalTickets } from '@/data/tickets/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type TicketsViewProps = {
  workspaceId: string;
  onTicketSelect?: (id: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

export function TicketsView({ workspaceId, onTicketSelect, onAction }: TicketsViewProps) {
  const tickets = listUniversalTickets(workspaceId);

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
      <div className="flex items-center justify-between pb-3 border-b border-border px-4 pt-3 shrink-0">
        <h1 className="text-base font-bold text-foreground">All Tickets</h1>
        <Button variant="solid" size="sm">
          <Plus size={14} strokeWidth={STROKE_WIDTH} />
          Add Ticket
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard tickets={tickets} onTicketSelect={onTicketSelect} />
      </div>
    </div>
  );
}
