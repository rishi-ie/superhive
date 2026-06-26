/**
 * Dashboard Overview tab — shown when no center selection or projects kanban.
 * Greeting + today's activity + awaiting input + bottlenecks + recent events + quick actions.
 */
import { CheckCircle, AlertTriangle, Layers, MessageCircle, Bot } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { EmptyState } from '../shared/EmptyState';
import { listUniversalTickets } from '@/data/tickets/store';
import { listAgents } from '@/data/agents/store';

type DashboardOverviewProps = {
  onTicketClick?: (id: string) => void;
  onOpenTab?: (kind: string) => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}


/**
 * Dashboard Overview tab.
 * @param onTicketClick - Called when a ticket is clicked
 * @param onChannelClick - Called when a channel is clicked
 * @param onAgentClick - Called when an agent is clicked
 */
export function DashboardOverview({ onTicketClick, onOpenTab }: DashboardOverviewProps) {
  const allTickets = listUniversalTickets();
  const allAgents = listAgents();

  const activeAgents = allAgents.filter(a => a.status === 'EXECUTING' || a.status === 'COMPILING');
  const awaitingReview = allTickets.filter(t => t.status === 'REVIEW');
  const bottlenecks = allTickets.filter(t => t.status === 'REVIEW' && t.priority === 'HIGH');

  return (
    <div className="p-3 space-y-4">

      {/* Greeting */}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{getGreeting()}</p>
        <p className="text-xs text-muted-foreground">{getToday()}</p>
      </div>

      {/* Today's activity stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Created" value={allTickets.length} />
        <StatCard label="Completed" value={allTickets.filter(t => t.status === 'MERGED').length} color="text-chart-2" />
        <StatCard label="Active" value={activeAgents.length} color="text-chart-2" />
      </div>

      {/* Awaiting Your Input */}
      <div className="space-y-2">
        <SectionLabel>Awaiting Your Input</SectionLabel>
        {awaitingReview.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={28} strokeWidth={1.5} />}
            title="All caught up"
            description="Nothing needs your attention right now"
          />
        ) : (
          <div className="space-y-1">
            {awaitingReview.slice(0, 5).map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onTicketClick?.(ticket.id)}
                className="w-full flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-[9px] font-fustat text-muted-foreground shrink-0">
                  {ticket.id}
                </span>
                <span className="text-xs text-foreground truncate flex-1">{ticket.title}</span>
                <span className="text-[9px] font-medium uppercase tracking-wider rounded border px-1 py-0.5 shrink-0">
                  {ticket.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Bottlenecks</SectionLabel>
          <div className="space-y-1">
            {bottlenecks.slice(0, 3).map(ticket => (
              <div
                key={ticket.id}
                className="flex items-center gap-2 p-2 rounded-md border border-chart-5/20 bg-chart-5/5"
              >
                <AlertTriangle size={12} className="text-chart-5 shrink-0" />
                <span className="text-[9px] font-fustat text-muted-foreground shrink-0">
                  {ticket.id}
                </span>
                <span className="text-xs text-foreground truncate flex-1">{ticket.title}</span>
                <span className="text-[9px] text-chart-5 shrink-0">REVIEW</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenTab?.('tickets')}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border/40 px-2 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <Layers size={12} />
          Create Ticket
        </button>
        <button
          type="button"
          onClick={() => onOpenTab?.('universal-channels')}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border/40 px-2 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <MessageCircle size={12} />
          Open Channels
        </button>
        <button
          type="button"
          onClick={() => onOpenTab?.('universal-agents')}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border/40 px-2 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <Bot size={12} />
          Browse Agents
        </button>
      </div>
    </div>
  );
}
