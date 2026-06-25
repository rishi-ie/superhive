/**
 * Workspace agent list with status indicators.
 */
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { OnboardingWizard } from './OnboardingWizard';
import { AGENTS_WIZARD_CONFIG } from '@/data/config/wizard-configs';
import { listAgents } from '@/data/agents/store';
import { listProjectAgents } from '@/data/projects/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

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
  workspaceId?: string;
  onAgentSelect?: (id: string) => void;
  selectedAgentId?: string | null;
  onAction?: OnboardingWizardProps['onAction'];
};

/**
 * @param workspaceId - Optional workspace to filter agents
 * @param onAgentSelect - Called when an agent is selected
 * @param selectedAgentId - Currently selected agent ID
 * @param onAction - Called when an onboarding action is taken
 */
export function AgentsView({ workspaceId, onAgentSelect, selectedAgentId, onAction }: AgentsViewProps) {
  const allAgents = listAgents();
  const workspaceAgentIds = workspaceId
    ? new Set(listProjectAgents(workspaceId).map(a => a.id))
    : null;
  const agents = workspaceAgentIds
    ? allAgents.filter(a => workspaceAgentIds.has(a.id))
    : allAgents;

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
