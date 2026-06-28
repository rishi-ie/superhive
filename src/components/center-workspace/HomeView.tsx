/**
 * Home dashboard tab — workspace overview with stats, projects, agents, channels, and tickets.
 */
import { useMemo } from 'react';
import { FolderOpen, Bot, MessageCircle, ClipboardCheck } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { NewButton } from '@/components/ui/NewButton';
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { KanbanColumn } from './KanbanColumn';
import { ChannelStatusPill } from '@/components/channels/ChannelStatusPill';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import {
  listProjects,
  listProjectAgents,
  listChannels,
} from '@/data/projects/store';
import {
  listUniversalTickets,
} from '@/data/tickets/store';
import {
  listAgents,
  getNextStep,
} from '@/data/agents/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type HomeViewProps = {
  workspaceId: string;
  workspaceName: string;
  onProjectSelect?: (id: string, workspaceId: string) => void;
  onAgentSelect?: (id: string) => void;
  onChannelSelect?: (id: string, workspaceId: string) => void;
  onTicketSelect?: (id: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

/**
 * @param workspaceId - Current workspace ID
 * @param workspaceName - Current workspace display name
 * @param onProjectSelect - Called when a project is selected
 * @param onAgentSelect - Called when an agent is selected
 * @param onChannelSelect - Called when a channel is selected
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAction - Called when an onboarding action is taken
 */
export function HomeView({
  workspaceId,
  workspaceName,
  onProjectSelect,
  onAgentSelect,
  onChannelSelect,
  onTicketSelect,
  onAction,
}: HomeViewProps) {
  const workspaceProjects = useMemo(
    () => listProjects({ status: 'ACTIVE' }).filter(p => p.workspaceId === workspaceId),
    [workspaceId],
  );

  const projectAgentNames = useMemo(
    () => new Set(listProjectAgents(workspaceId).map(a => a.name)),
    [workspaceId],
  );

  const workspaceAgents = useMemo(
    () => listAgents().filter(a => projectAgentNames.has(a.name)),
    [projectAgentNames],
  );

  const workspaceTickets = useMemo(
    () => listUniversalTickets(workspaceId),
    [workspaceId],
  );

  const workspaceChannels = useMemo(
    () => listChannels(workspaceId),
    [workspaceId],
  );

  const ticketsByStatus = useMemo(() => {
    const cols: Record<string, typeof workspaceTickets> = {
      BACKLOG: [], EXECUTING: [], REVIEW: [], MERGED: [],
    };
    for (const t of workspaceTickets) {
      if (cols[t.status]) cols[t.status]!.push(t);
    }
    return cols;
  }, [workspaceTickets]);

  const awaitingChannels = useMemo(
    () => workspaceChannels.filter(ch => ch.status === 'AWAITING_REPLY').length,
    [workspaceChannels],
  );

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{workspaceName}</h1>
        <NewButton
          label="New Project"
          onClick={() => onAction?.('create-project')}
        />
      </div>

      {/* Stat strip — 4 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Projects" value={workspaceProjects.length} />
        <StatCard
          label="Open Tickets"
          value={workspaceTickets.filter(t => t.status !== 'MERGED').length}
        />
        <StatCard
          label="Active Agents"
          value={workspaceAgents.filter(a => a.status === 'EXECUTING' || a.status === 'COMPILING').length}
          color="text-chart-2"
        />
        <StatCard
          label="Awaiting Reply"
          value={awaitingChannels}
          color="text-chart-3"
        />
      </div>

      {/* Projects — compact card grid */}
      <div className="space-y-2">
        <SectionLabel>Projects</SectionLabel>
        {workspaceProjects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} strokeWidth={1.5} />}
            title="No projects yet"
            description="Create your first project to get started."
            action={
              <NewButton
                label="New Project"
                onClick={() => onAction?.('create-project')}
              />
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {workspaceProjects.slice(0, 9).map(p => (
              <button
                key={p.id}
                onClick={() => onProjectSelect?.(p.id, workspaceId)}
                className="flex flex-col gap-1.5 p-3 rounded-md border border-border/40 bg-card hover:bg-hover-tint hover:border-border/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color ?? 'var(--chart-1)' }}
                  />
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-chart-1 transition-colors">
                    {p.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{p.tickets.length} tickets</span>
                  <span>{p.agents.length} agents</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agents + Channels — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Agents — compact card grid */}
        <div className="space-y-2">
          <SectionLabel>Agents</SectionLabel>
          {workspaceAgents.length === 0 ? (
            <EmptyState
              icon={<Bot size={28} strokeWidth={1.5} />}
              title="No agents assigned"
              description="Add agents to your workspace to get started."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {workspaceAgents.slice(0, 8).map(agent => {
                const nextStep = getNextStep(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => onAgentSelect?.(agent.id)}
                    className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/40 bg-card hover:bg-hover-tint hover:border-border/80 transition-colors text-left group"
                  >
                    <Avatar
                      size="xs"
                      name={agent.name}
                      fallback={agent.name.slice(0, 2).toUpperCase()}
                      color="bg-chart-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-chart-1 transition-colors">
                          {agent.name}
                        </span>
                        <StatusDot status={agent.status} size="xs" />
                      </div>
                      {nextStep && nextStep !== 'Next — Standing by' ? (
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                          {nextStep}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">
                          {agent.role}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Channels — vertical list */}
        <div className="space-y-2">
          <SectionLabel>Channels</SectionLabel>
          {workspaceChannels.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={28} strokeWidth={1.5} />}
              title="No channels yet"
              description="Channels will appear when agents communicate."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {workspaceChannels.slice(0, 8).map(ch => (
                <button
                  key={ch.id}
                  onClick={() => onChannelSelect?.(ch.id, workspaceId)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border/40 bg-card hover:bg-hover-tint hover:border-border/80 transition-colors text-left group"
                >
                  <MessageCircle
                    size={13}
                    strokeWidth={STROKE_WIDTH}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-xs text-foreground flex-1 truncate group-hover:text-chart-1 transition-colors">
                    {ch.topic}
                  </span>
                  <ChannelStatusPill status={ch.status} />
                  {ch.messageCount > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {ch.messageCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket board — horizontal scroll of kanban columns */}
      <div className="space-y-2">
        <SectionLabel>Ticket Board</SectionLabel>
        {workspaceTickets.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={28} strokeWidth={1.5} />}
            title="No tickets"
            description="Tickets assigned to this workspace will appear here."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {(['BACKLOG', 'EXECUTING', 'REVIEW', 'MERGED'] as const).map(status => {
              const col = ticketsByStatus[status] ?? [];
              return (
                <KanbanColumn
                  key={status}
                  label={status}
                  status={status}
                  tickets={col.slice(0, 6)}
                  selectedTicketId={null}
                  onTicketSelect={onTicketSelect}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
