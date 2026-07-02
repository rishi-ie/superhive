/**
 * Sub-agent nested list — shows sub-agents spawned by a parent agent.
 */
import { Bot, Clock, CheckCircle2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listSubAgentsByParent } from '@/data/sub_agents/store';

type SubAgentListProps = {
  parentUlid: string;
};

export function SubAgentList({ parentUlid }: SubAgentListProps) {
  const subAgents = listSubAgentsByParent(parentUlid);

  if (subAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 p-6">
        <Bot size={32} strokeWidth={STROKE_WIDTH} />
        <p className="text-sm">No sub-agents yet</p>
        <p className="text-[10px]">Sub-agents spawned by this agent will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      {subAgents.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-card/30"
        >
          {s.status === 'FINISHED' ? (
            <CheckCircle2 size={14} strokeWidth={STROKE_WIDTH} className="text-chart-2 shrink-0" />
          ) : (
            <Clock size={14} strokeWidth={STROKE_WIDTH} className="text-chart-3 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{s.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {s.kind}{s.task ? ` · ${s.task}` : ''}
            </div>
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-medium ${
            s.status === 'FINISHED' ? 'text-chart-2' : 'text-chart-3'
          }`}>
            {s.status}
          </span>
        </div>
      ))}
    </div>
  );
}
