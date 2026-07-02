/**
 * All agents across workspaces with search, status filter, and sort.
 * Includes a "New Agent" button in the page header.
 */
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusFilter } from '@/components/ui/StatusFilter';
import { Select } from '@/components/ui/Select';
import { NewButton } from '@/components/ui/NewButton';
import { UniversalListCard } from '@/components/ui/UniversalListCard';
import { EmptyState } from '@/pages/RightAuxiliary/shared/EmptyState';
import { Bot } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listAgents, getTelemetry, getPermissions, getAuditItems, getActionLog, getNextStep } from '@/data/agent/store';
import type { AgentStatus } from '@/data/agent/interface';

type SortKey = 'status' | 'name' | 'uptime';

const STATUS_OPTIONS = [
  { value: 'ALL' as const, label: 'All' },
  { value: 'EXECUTING' as const, label: 'Working' },
  { value: 'COMPILING' as const, label: 'Compiling' },
  { value: 'IDLE' as const, label: 'Idle' },
  { value: 'AWAITING_HUMAN' as const, label: 'Awaiting' },
  { value: 'ERROR_LOOP' as const, label: 'Error' },
] as const;

function ContextBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const filled = Math.round((value / 1) * 12);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`inline-block w-1 h-1.5 rounded-sm ${i < filled ? 'bg-chart-2' : 'bg-muted-foreground/30'}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

type UniversalAgentsViewProps = {
  onAgentSelect?: (id: string) => void;
  selectedAgentId?: string | null;
  onCreateAgent?: () => void;
};

/**
 * @param onAgentSelect - Called when an agent is selected
 * @param selectedAgentId - Currently selected agent ID
 * @param onCreateAgent - Called when "New Agent" button is clicked
 */
export function UniversalAgentsView({ onAgentSelect, selectedAgentId, onCreateAgent }: UniversalAgentsViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgentStatus>('ALL');
  const [sort, setSort] = useState<SortKey>('status');

  const agents = listAgents();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: agents.length };
    for (const a of agents) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }, [agents]);

  const filterOptions = useMemo(() =>
    STATUS_OPTIONS.map(o => ({ ...o, count: statusCounts[o.value === 'ALL' ? 'ALL' : o.value] ?? 0 })),
    [statusCounts]
  );

  const filtered = useMemo(() => {
    let result = agents;
    if (statusFilter !== 'ALL') {
      result = result.filter(a => a.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.activeTask.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'uptime') return 0;
      const order: Record<AgentStatus, number> = { EXECUTING: 0, COMPILING: 1, ERROR_LOOP: 2, AWAITING_HUMAN: 3, IDLE: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });
  }, [agents, query, statusFilter, sort]);

  if (agents.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">All Agents</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Universal agents · 0 agents
            </p>
          </div>
          {onCreateAgent && <NewButton label="New Agent" onClick={onCreateAgent} />}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Bot size={32} strokeWidth={STROKE_WIDTH} />}
            title="No agents yet"
            description="AI agents execute work, monitor systems, and coordinate with the swarm"
            action={
              onCreateAgent ? (
                <NewButton label="New Agent" onClick={onCreateAgent} />
              ) : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">All Agents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Universal agents · {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onCreateAgent && <NewButton label="New Agent" onClick={onCreateAgent} />}
      </div>

      <div className="px-6 pb-3 flex items-center gap-3 shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search agents..."
          className="flex-1"
        />
        <Select
          value={sort}
          options={[
            { value: 'status', label: 'Sort: Status' },
            { value: 'name', label: 'Sort: Name' },
            { value: 'uptime', label: 'Sort: Uptime' },
          ]}
          onChange={v => setSort(v as SortKey)}
          className="w-32"
        />
      </div>

      <div className="px-6 pb-3 shrink-0">
        <StatusFilter
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No agents match &ldquo;{query}&rdquo;</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setStatusFilter('ALL'); }}
              className="mt-2 text-xs text-chart-1 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(agent => {
              const telemetry = getTelemetry(agent.id);
              const permissions = getPermissions(agent.id);
              const audits = getAuditItems(agent.id);
              const actionLog = getActionLog(agent.id);
              const nextStep = getNextStep(agent.id);
              const initials = agent.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
              const lastAction = actionLog[0];

              return (
                <UniversalListCard
                  key={agent.id}
                  selected={selectedAgentId === agent.id}
                  onClick={() => onAgentSelect?.(agent.id)}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar size="xs" fallback={initials} />
                    <StatusDot status={agent.status} />
                    <span className="text-xs font-semibold text-foreground">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">{agent.role}</span>
                    {permissions && (
                      <span className="text-[10px] text-muted-foreground shrink-0 font-fustat">
                        {permissions.modelEngine}
                      </span>
                    )}
                    {agent.uptime && (
                      <span className="text-[10px] text-muted-foreground shrink-0">{agent.uptime}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate pl-px leading-4">
                    {agent.activeTask}
                  </p>

                  <div className="flex items-center gap-3">
                    <ContextBar value={telemetry?.contextSaturation ?? 0} />
                    {audits.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {audits.length} pending audit{audits.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {lastAction && (
                      <span className="text-[10px] text-muted-foreground">
                        · last {lastAction.action.toLowerCase()}
                      </span>
                    )}
                  </div>

                  {nextStep && (
                    <p className="text-[10px] text-muted-foreground/70 truncate leading-3">
                      → next: {nextStep}
                    </p>
                  )}
                </UniversalListCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
