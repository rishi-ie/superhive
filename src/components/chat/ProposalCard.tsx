/**
 * ProposalCard — inline card in chat when an agent proposes a ticket.
 * Approve & Create / Edit / Cancel.
 */
import { useState } from 'react';
import { ClipboardCheck, Pencil, X, Check } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/toasts/context';
import { createTicket } from '@/data/ticket/store';
import { useWsEvents } from '@/lib/ws-client';

export type Proposal = {
  title: string;
  description?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  type?: 'FEATURE' | 'BUG' | 'REFACTOR' | 'INFRA';
  suggestedAssignee?: string;
};

type ProposalCardProps = {
  proposal: Proposal;
  workspaceId: string;
  onResolved?: () => void;
};

export function ProposalCard({ proposal, workspaceId, onResolved }: ProposalCardProps) {
  const toast = useToast();
  const [resolved, setResolved] = useState(false);

  const handleApprove = () => {
    const t = createTicket({
      title: proposal.title,
      projectName: 'Unassigned',
      workspaceId,
      priority: proposal.priority ?? 'MEDIUM',
      type: proposal.type ?? 'FEATURE',
      assigneeName: proposal.suggestedAssignee ?? 'Unassigned',
    });
    if (t) {
      toast({ title: 'Ticket created', description: t.title });
      setResolved(true);
      onResolved?.();
    } else {
      toast({ title: 'Could not create ticket', type: 'error' });
    }
  };

  if (resolved) return null;

  return (
    <div className="rounded-md border border-border bg-card p-3 my-2 max-w-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <ClipboardCheck size={12} strokeWidth={STROKE_WIDTH} className="text-chart-3" />
        <span className="text-[10px] font-medium text-chart-3 uppercase tracking-wider">Proposed ticket</span>
      </div>
      <h3 className="text-sm font-medium text-foreground">{proposal.title}</h3>
      {proposal.description && (
        <p className="text-xs text-muted-foreground mt-1">{proposal.description}</p>
      )}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
        {proposal.priority && <span className="px-1.5 py-0.5 rounded bg-tertiary">Priority: {proposal.priority}</span>}
        {proposal.type && <span className="px-1.5 py-0.5 rounded bg-tertiary">{proposal.type}</span>}
        {proposal.suggestedAssignee && <span>→ {proposal.suggestedAssignee}</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <Button size="sm" onClick={handleApprove}>
          <Check size={12} strokeWidth={STROKE_WIDTH} />
          Approve & Create
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { toast({ title: 'Edit coming soon' }); }}>
          <Pencil size={12} strokeWidth={STROKE_WIDTH} />
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setResolved(true); onResolved?.(); }}>
          <X size={12} strokeWidth={STROKE_WIDTH} />
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** Hook to receive TICKET_PROPOSAL WS events and return pending proposals. */
export function useTicketProposals(): Proposal[] {
  // Implementation placeholder — wired via ProjectAgentView directly.
  // The hook pattern keeps the import surface small.
  const [_proposals] = useState<Proposal[]>([]);
  useWsEvents(() => { /* placeholder */ });
  return _proposals;
}
