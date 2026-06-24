import type { Project, ProjectAgent, SwarmActivity } from '@/data/projects/store';
import { STROKE_WIDTH } from '@/lib/constants';

type ProjectOverviewTabProps = {
  project: Project;
  onTicketClick?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
};

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-2 rounded-md border border-border bg-card">
      <span className={`text-lg font-fustat font-bold ${color ?? 'text-foreground'}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function ProjectOverviewTab({ project, onTicketClick, onAgentClick, onChannelClick }: ProjectOverviewTabProps) {
  const todo = project.tickets.filter(t => t.status === 'TODO').length;
  const executing = project.tickets.filter(t => t.status === 'EXECUTING').length;
  const done = project.tickets.filter(t => t.status === 'DONE').length;
  const openChannels = project.channels.filter(c => c.status !== 'RESOLVED').length;
  const lastActivity = project.activity[0];

  const topAgents = project.agents.slice(0, 3);
  const recentActivity = project.activity.slice(0, 5);

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{project.title}</h2>
        {lastActivity && (
          <p className="text-[10px] text-muted-foreground">
            Last activity {lastActivity.timestamp}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <StatCard label="Todo" value={todo} />
        <StatCard label="Executing" value={executing} color="text-chart-3" />
        <StatCard label="Done" value={done} color="text-chart-2" />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <StatCard label="Agents" value={project.agents.length} />
        <StatCard label="Channels" value={openChannels} />
      </div>

      {topAgents.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Contributors</span>
          <div className="space-y-1">
            {topAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => onAgentClick?.(agent.id)}
                  className="size-4 rounded-full bg-chart-2 flex items-center justify-center text-[8px] font-bold text-sidebar-primary-foreground hover:opacity-80 transition-opacity shrink-0"
                >
                  {agent.initials}
                </button>
                <button
                  onClick={() => onAgentClick?.(agent.id)}
                  className="text-[10px] text-muted-foreground truncate hover:text-foreground transition-colors flex-1"
                >
                  {agent.name}
                </button>
                <span className="text-[9px] text-muted-foreground/60 shrink-0">{agent.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recent Activity</span>
          <div className="space-y-0.5">
            {recentActivity.map(item => {
              const agent = project.agents.find(a => a.name === item.primaryAgent);
              return (
                <div key={item.id} className="flex items-start gap-1.5 text-[10px]">
                  <span className="text-muted-foreground/60 shrink-0 font-fustat">{item.timestamp}</span>
                  <span className="text-muted-foreground/60 shrink-0">·</span>
                  <span className="font-semibold text-foreground shrink-0">{agent?.initials ?? '?'}</span>
                  <span className="text-muted-foreground/80 truncate flex-1">{item.action}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
