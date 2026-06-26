/**
 * Collapsible Active section — shows active agents and tasks with status indicators.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { StatusDot } from '@/components/ui/StatusDot';
import { SectionLabel } from '@/components/ui/SectionLabel';

export type ActiveAgent = {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
};

export type ActiveTask = {
  id: string;
  title: string;
  assignedTo?: string;
};

type ActiveSectionProps = {
  agents: ActiveAgent[];
  tasks: { id: string; title: string; assignedTo?: string }[];
  onAgentClick?: (id: string) => void;
  onTaskClick?: (id: string) => void;
};

/**
 * Collapsible Active section — shows active agents and tasks with status indicators.
 * @param agents - Active agents to display
 * @param tasks - Active tasks to display
 * @param onAgentClick - Called when agent is clicked
 * @param onTaskClick - Called when task is clicked
 */
export function ActiveSection({ agents, tasks, onAgentClick, onTaskClick }: ActiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;

  if (agents.length === 0 && tasks.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        ) : (
          <ChevronRight size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        )}
        <Zap size={12} strokeWidth={STROKE_WIDTH} className="shrink-0 text-chart-2" />
        <span className="flex-1 text-left"><SectionLabel>Active</SectionLabel></span>
        <span className="text-[10px] text-muted-foreground font-fustat">
          {activeCount > 0 ? `${activeCount} active` : 'none'}
        </span>
      </button>
      {isExpanded && (
        <div className="mt-0.5 ml-2 space-y-0.5">
          {agents.slice(0, 5).map((agent) => (
            <button
              key={agent.id}
              onClick={() => onAgentClick?.(agent.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <StatusDot
                status={
                  agent.status === 'busy'
                    ? 'AWAITING_HUMAN'
                    : agent.status === 'active'
                    ? 'EXECUTING'
                    : 'IDLE'
                }
                size="xs"
              />
              <span className="flex-1 truncate text-left text-xs">{agent.name}</span>
              {agent.currentTask && (
                <span className="truncate text-[10px] text-muted-foreground/60">
                  {agent.currentTask}
                </span>
              )}
            </button>
          ))}
          {tasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskClick?.(task.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <div className="size-1.5 rounded-full bg-chart-1 shrink-0" />
              <span className="flex-1 truncate text-left text-xs">{task.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
