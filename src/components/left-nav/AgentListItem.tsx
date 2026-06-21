import { StatusDot } from '@/components/ui/StatusDot';
import type { AccordionAgent } from '@/data/mock/accordion-employees';

type AgentListItemProps = {
  agent: AccordionAgent;
  onClick?: (id: string) => void;
};

export function AgentListItem({ agent, onClick }: AgentListItemProps) {
  return (
    <button
      onClick={() => onClick?.(agent.id)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
    >
      <StatusDot status={agent.status} />
      <span className="flex-1 truncate text-left text-xs">{agent.name}</span>
      {agent.currentTask && (
        <span className="truncate text-[10px] text-muted-foreground/60 max-w-[100px]">
          {agent.currentTask}
        </span>
      )}
    </button>
  );
}