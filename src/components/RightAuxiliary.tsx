import { useRef, useEffect } from 'react';
import { RightPanelTabs } from './right-auxiliary/RightPanelTabs';
import { TelemetryDeck } from './right-auxiliary/TelemetryDeck';
import { ControlMatrix } from './right-auxiliary/ControlMatrix';
import { AuditQueue } from './right-auxiliary/AuditQueue';
import { RightPanelActivityFeed } from './right-auxiliary/RightPanelActivityFeed';
import { SessionsView } from './right-auxiliary/SessionsView';
import { TicketOverviewTab } from './right-auxiliary/TicketOverviewTab';
import { ProjectDetailsTab } from './right-auxiliary/ProjectDetailsTab';
import { ChannelOverviewTab } from './right-auxiliary/ChannelOverviewTab';
import { PanelEmptyState } from './right-auxiliary/PanelEmptyState';
import { getRightPanelTabs, type RightPanelContext, type RightPanelTabId } from '@/data/right-panel-tabs';
import { getActiveEmployee, getEmployee } from '@/data/employees/store';
import { listSwarmActivity as listProjActivity, listProjectAgents as listProjAgents } from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import type { UniversalTicket } from '@/data/tickets/store';
import { Sliders } from 'lucide-react';

type RightAuxiliaryProps = {
  width: number;
  onWidthChange: (width: number) => void;
  context: RightPanelContext;
  tab: RightPanelTabId | null;
  ticketId?: string | null;
  onTabChange?: (tab: RightPanelTabId) => void;
  onApproveAudit?: (id: string) => void;
  onDenyAudit?: (id: string) => void;
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

function TicketDetail({ ticket, agents }: { ticket: UniversalTicket; agents: ReturnType<typeof listProjAgents> }) {
  const initials = ticket.assignee.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const priorityColors: Record<string, string> = { HIGH: 'bg-chart-5/15 text-chart-5 border-chart-5/40', MEDIUM: 'bg-chart-3/15 text-chart-3 border-chart-3/40', LOW: 'bg-secondary/40 text-muted-foreground border-border' };
  const typeLabels: Record<string, string> = { BUG: 'Bug', FEATURE: 'Feature', REFACTOR: 'Refactor', INFRA: 'Infra' };

  return (
    <div className="p-3 space-y-3 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-fustat text-chart-2 bg-chart-2/10 rounded px-1 py-0.5">{ticket.id}</span>
        <span className={`text-[9px] font-medium uppercase tracking-wider rounded border px-1.5 py-0.5 ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
        <span className="text-[9px] text-muted-foreground rounded border border-border bg-secondary/40 px-1.5 py-0.5">{typeLabels[ticket.type]}</span>
        <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${ticket.status === 'EXECUTING' ? 'bg-chart-2/15 text-chart-2 border-chart-2/40' : ticket.status === 'REVIEW' ? 'bg-chart-3/15 text-chart-3 border-chart-3/40' : 'bg-muted/20 text-muted-foreground border-muted-foreground/40'}`}>{ticket.status}</span>
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight">{ticket.title}</p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-full bg-chart-2 flex items-center justify-center text-[9px] font-bold text-sidebar-primary-foreground">{initials}</div>
          <span className="text-xs text-muted-foreground truncate">{ticket.assignee.name}</span>
          {ticket.assignee.isAI && <span className="size-1.5 rounded-full bg-chart-2 pulse-executing shrink-0" />}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded px-2 py-1.5">
        Project: <span className="text-foreground">{ticket.projectName}</span>
      </div>
    </div>
  );
}

export function RightAuxiliary({
  width,
  onWidthChange,
  context,
  tab,
  ticketId,
  onTabChange,
  onApproveAudit,
  onDenyAudit,
}: RightAuxiliaryProps) {
  const isResizingRef = useRef(false);

  const rightPanelTabs = getRightPanelTabs(context);
  const activeEmployee = context?.kind === 'employee' ? getEmployee(context.employeeId) ?? getActiveEmployee(context.employeeId) : getActiveEmployee(null);
  const swarmActivity = listProjActivity();
  const projectAgents = listProjAgents();
  const selectedTicket = ticketId ? listUniversalTickets().find(t => t.id === ticketId) : null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const showEmptyState = !context || rightPanelTabs.length === 0;
  const effectiveTab = rightPanelTabs.some(t => t.id === tab) ? tab : (rightPanelTabs[0]?.id ?? null);

  return (
    <>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
      <div
        className="flex h-full flex-col bg-sidebar border-l border-sidebar-border/40"
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <div className="h-9 shrink-0" />
        {showEmptyState ? (
          <PanelEmptyState
            title="No selection"
            description="Select a project, employee, or ticket to see details here."
          />
        ) : (
          <>
            <RightPanelTabs
              tabs={rightPanelTabs}
              activeTab={effectiveTab ?? undefined}
              onTabChange={(id) => onTabChange?.(id as RightPanelTabId)}
            />
            <div className="flex-1 overflow-y-auto">
              {effectiveTab === 'overview' && context?.kind === 'employee' && activeEmployee && (
                <>
                  <TelemetryDeck agent={activeEmployee} />
                  {swarmActivity.length > 0 && (
                    <RightPanelActivityFeed items={swarmActivity} agents={projectAgents} />
                  )}
                </>
              )}
              {effectiveTab === 'overview' && context?.kind === 'ticket' && (
                <TicketOverviewTab />
              )}
              {effectiveTab === 'overview' && context?.kind === 'project' && (
                <ProjectDetailsTab />
              )}
              {effectiveTab === 'overview' && context?.kind === 'channel' && (
                <ChannelOverviewTab />
              )}
              {effectiveTab === 'manage' && context?.kind === 'employee' && activeEmployee && (
                <ControlMatrix agent={activeEmployee} />
              )}
              {effectiveTab === 'manage' && context?.kind === 'ticket' && (
                <TicketOverviewTab />
              )}
              {effectiveTab === 'manage' && context?.kind === 'project' && (
                <ProjectDetailsTab />
              )}
              {effectiveTab === 'manage' && context?.kind === 'channel' && (
                <ChannelOverviewTab />
              )}
              {effectiveTab === 'project' && context?.kind === 'project' && (
                <ProjectDetailsTab />
              )}
              {effectiveTab === 'inbox' && (
                <>
                  {selectedTicket && <TicketDetail ticket={selectedTicket} agents={projectAgents} />}
                  <AuditQueue
                    agent={activeEmployee}
                    onApprove={onApproveAudit}
                    onDeny={onDenyAudit}
                  />
                </>
              )}
              {effectiveTab === 'sessions' && context?.kind === 'employee' && (
                <SessionsView />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
