import type { SwarmActivity, ProjectAgent } from '@/data/mock/project';

type RightPanelActivityFeedProps = {
  items: SwarmActivity[];
  agents: ProjectAgent[];
};

export function RightPanelActivityFeed({ items, agents }: RightPanelActivityFeedProps) {
  const recent = items.slice(0, 6);

  return (
    <div className="border-t border-border px-3 py-2 space-y-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Activity</span>
      <div className="space-y-1">
        {recent.map(item => {
          const primaryInitials = agents.find(a => a.name === item.primaryAgent)?.initials ?? '?';
          const targetInitials = agents.find(a => a.name === item.targetAgent)?.initials ?? '?';
          const shortVerb = item.action
            .replace('requested schema validation from', '→ validated')
            .replace('shared database snapshot with', '→ shared db')
            .replace('handed off design tokens to', '→ handoff')
            .replace('requested code review from', '→ review')
            .replace('requested deployment pipeline from', '→ deploy')
            .replace('escalated timeout issue to', '↗ escalated');

          return (
            <div key={item.id} className="flex items-start gap-1.5 text-[10px]">
              <span className="text-muted-foreground/60 shrink-0 font-fustat">{item.timestamp}</span>
              <span className="text-muted-foreground/60 shrink-0">·</span>
              <span className="font-semibold text-foreground shrink-0">{primaryInitials}</span>
              <span className="text-muted-foreground/80 truncate flex-1">{shortVerb}</span>
              <span className="text-muted-foreground/80 shrink-0">→</span>
              <span className="font-semibold text-foreground shrink-0">{targetInitials}</span>
              <span className="text-muted-foreground/60 shrink-0">·</span>
              <span className="text-muted-foreground/60 shrink-0">{item.context}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}