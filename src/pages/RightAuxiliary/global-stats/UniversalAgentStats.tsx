/**
 * Universal agent stats across all workspaces — total, executing, status breakdown.
 */
import type { Agent } from '@/data/agent/store';
import type { Workspace } from '@/data/workspace/interface';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';

type UniversalAgentStatsProps = {
  agents: Agent[];
  workspaces: Workspace[];
  onAgentClick?: (id: string) => void;
};

/**
 * Universal agent stats across all workspaces — total, executing, status breakdown.
 * @param agents - All agents to aggregate
 * @param workspaces - Workspaces (for future expansion)
 * @param onAgentClick - Called when agent is clicked
 */
export function UniversalAgentStats({ agents }: UniversalAgentStatsProps) {
  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={agents.length} />
        <StatCard label="Executing" value={agents.filter(a => a.status === 'EXECUTING').length} color="text-chart-2" />
      </div>

      <div className="border-t border-border/40 pt-3 space-y-2">
        <SectionLabel>By Status</SectionLabel>
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
      </div>
    </div>
  );
}
