/**
 * Agent statistics for a workspace — total, active count, status breakdown, top active agents.
 */
import type { Agent } from '@/data/agents/store';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';

type AgentStatsProps = {
  agents: Agent[];
  onAgentClick?: (id: string) => void;
};

/**
 * Agent statistics for a workspace — total, active count, status breakdown, top active agents.
 * @param agents - Agents to aggregate
 * @param onAgentClick - Called when agent is clicked
 */
export function AgentStats({ agents, onAgentClick }: AgentStatsProps) {
  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }
  const activeAgents = agents.filter(a => a.status === 'EXECUTING' || a.status === 'COMPILING');

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={agents.length} />
        <StatCard label="Active" value={activeAgents.length} color="text-chart-2" />
      </div>

      <div className="space-y-1">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-card">
            <span className="text-[10px] text-muted-foreground capitalize">
              {status.replace('_', ' ').toLowerCase()}
            </span>
            <span className="text-[10px] font-fustat font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>

      {activeAgents.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Top Active</SectionLabel>
          <div className="space-y-1">
            {activeAgents.slice(0, 4).map(a => (
              <button
                key={a.id}
                onClick={() => onAgentClick?.(a.id)}
                className="w-full text-left p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors"
                type="button"
              >
                <div className="text-[10px] font-medium text-foreground truncate">{a.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{a.activeTask}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
