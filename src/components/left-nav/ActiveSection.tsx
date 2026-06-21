import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, Zap } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

export type ActiveEmployee = {
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
  employees: ActiveEmployee[];
  tasks: { id: string; title: string; assignedTo?: string }[];
  onEmployeeClick?: (id: string) => void;
  onTaskClick?: (id: string) => void;
};

export function ActiveSection({ employees, tasks, onEmployeeClick, onTaskClick }: ActiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeCount = employees.filter((e) => e.status === 'active' || e.status === 'busy').length;

  if (employees.length === 0 && tasks.length === 0) {
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
        <span className="flex-1 text-left">Active</span>
        <span className="text-[10px] text-muted-foreground font-fustat">
          {activeCount > 0 ? `${activeCount} active` : 'none'}
        </span>
      </button>
      {isExpanded && (
        <div className="mt-0.5 ml-2 space-y-0.5">
          {employees.slice(0, 5).map((employee) => (
            <button
              key={employee.id}
              onClick={() => onEmployeeClick?.(employee.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Circle
                size={6}
                strokeWidth={STROKE_WIDTH}
                className={`shrink-0 ${
                  employee.status === 'busy'
                    ? 'text-chart-1 fill-chart-1'
                    : employee.status === 'active'
                    ? 'text-chart-2 fill-chart-2'
                    : 'text-muted-foreground fill-muted-foreground'
                }`}
              />
              <span className="flex-1 truncate text-left text-xs">{employee.name}</span>
              {employee.currentTask && (
                <span className="truncate text-[10px] text-muted-foreground/60">
                  {employee.currentTask}
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