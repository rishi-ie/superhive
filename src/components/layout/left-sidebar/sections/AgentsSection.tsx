import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { AccordionSection } from '@/components/layout/common/primitives';
import { AgentRow } from '@/components/layout/common/primitives/AgentRow';
import { EmptyCtaButton } from '@/components/layout/common/primitives/EmptyCtaButton';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import type { Agent } from '@/types/electron';

interface AgentsSectionProps {
  items: Agent[];
}

function isAgentActive(status: Agent['status']): boolean {
  return status === 'running' || status === 'busy';
}

export function AgentsSection({ items }: AgentsSectionProps) {
  const navigate = useNavigate();
  const { setOpen } = useOpenCreateAgent();

  return (
    <AccordionSection label="Agents" defaultOpen={false}>
      {items.length > 0
        ? items.map((a) => (
            <AgentRow
              key={a.id}
              name={a.name}
              status={isAgentActive(a.status) ? 'active' : 'idle'}
              currentAction="Working…"
              onClick={() => navigate(`/agents/${a.id}`)}
            />
          ))
        : (
            <EmptyCtaButton
              icon={<HugeiconsIcon icon={PlusSignIcon} className="size-4 flex-shrink-0" />}
              label="New agent"
              onClick={() => setOpen(true)}
            />
          )}
    </AccordionSection>
  );
}
