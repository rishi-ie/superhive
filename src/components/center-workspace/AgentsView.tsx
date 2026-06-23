import { Avatar } from '@/components/ui/Avatar';
import { Loader2 } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { OnboardingWizard } from './OnboardingWizard';
import { AGENTS_WIZARD_CONFIG } from '@/data/wizard-configs';
import { listAgents } from '@/data/agents/store';
import type { AgentStatus } from '@/data/agents/interface';
import type { OnboardingWizardProps } from './OnboardingWizard';

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === 'EXECUTING') return <span className="size-1.5 rounded-full bg-chart-2 pulse-executing shrink-0" />;
  if (status === 'COMPILING') return <Loader2 size={8} strokeWidth={STROKE_WIDTH} className="shrink-0 animate-spin text-chart-3" />;
  if (status === 'IDLE') return <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />;
  if (status === 'ERROR_LOOP') return <span className="size-1.5 rounded-full bg-chart-5 pulse-error shrink-0" />;
  return <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />;
}

type AgentCardProps = {
  agent: ReturnType<typeof listAgents>[number];
  selected?: boolean;
  onClick?: () => void;
};

function AgentCard({ agent, selected, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-2 p-2 rounded-md border bg-card hover:border-border/80 transition-colors w-full text-left ${
        selected ? 'border-chart-1' : 'border-border'
      }`}
    >
      <Avatar size="xs" fallback={agent.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <StatusDot status={agent.status} />
          <span className="text-xs font-semibold text-foreground truncate">{agent.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground truncate">{agent.role}</span>
      </div>
      {agent.uptime && (
        <span className="text-[9px] font-fustat text-muted-foreground shrink-0">{agent.uptime}</span>
      )}
    </button>
  );
}

type AgentsViewProps = {
  onAgentSelect?: (id: string) => void;
  selectedAgentId?: string | null;
  onAction?: OnboardingWizardProps['onAction'];
};

export function AgentsView({ onAgentSelect, selectedAgentId, onAction }: AgentsViewProps) {
  const agents = listAgents();

  if (agents.length === 0) {
    return (
      <OnboardingWizard
        config={AGENTS_WIZARD_CONFIG}
        onAction={onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Agents</h1>
        <span className="text-xs text-muted-foreground">{agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selectedAgentId === agent.id}
            onClick={() => onAgentSelect?.(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}
