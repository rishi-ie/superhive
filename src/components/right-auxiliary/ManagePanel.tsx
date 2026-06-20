import { Circle } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { teamMembers } from '@/data/mock/right-panel';

export function ManagePanel() {
  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Team Members
      </div>
      <div className="space-y-1">
        {teamMembers.map((member) => (
          <button
            key={member.id}
            className="flex w-full items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left"
          >
            <Circle
              size={6}
              strokeWidth={STROKE_WIDTH}
              className={`shrink-0 ${
                member.status === 'busy'
                  ? 'text-chart-1 fill-chart-1'
                  : member.status === 'active'
                  ? 'text-chart-2 fill-chart-2'
                  : 'text-muted-foreground fill-muted-foreground'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground truncate">{member.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
            </div>
            <div className="text-[10px] text-muted-foreground shrink-0">
              {member.tasks} tasks
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
