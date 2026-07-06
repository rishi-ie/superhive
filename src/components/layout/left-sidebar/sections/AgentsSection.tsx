import { useNavigate } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { AccordionRow } from '../primitives/AccordionRow';
import { EmptyCtaButton } from '../primitives/EmptyCtaButton';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import type { Agent } from '@/types/electron';

interface AgentsSectionProps {
  items: Agent[];
}

export function AgentsSection({ items }: AgentsSectionProps) {
  const navigate = useNavigate();
  const { setOpen } = useOpenCreateAgent();

  return (
    <AccordionSection label="Agents">
      {items.length > 0
        ? items.map((a) => (
            <AccordionRow
              key={a.id}
              icon={<Bot className="size-4 flex-shrink-0" />}
              label={a.name}
              onClick={() => navigate(`/agents/${a.id}`)}
            />
          ))
        : (
            <EmptyCtaButton
              icon={<Plus className="size-4 flex-shrink-0" />}
              label="New agent"
              onClick={() => setOpen(true)}
            />
          )}
    </AccordionSection>
  );
}