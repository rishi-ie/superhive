import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Pin, MoreHorizontal } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { AccordionRow } from '../primitives/AccordionRow';
import { EmptyCtaButton } from '../primitives/EmptyCtaButton';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import type { Agent } from '@/types/electron';

interface AgentsSectionProps {
  items: Agent[];
}

const AgentActions = () => (
  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
    <div className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-[#727272] hover:bg-sidebar-accent hover:text-[#dedede]">
      <Pin className="size-3.5" />
    </div>
    <div className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-[#727272] hover:bg-sidebar-accent hover:text-[#dedede]">
      <MoreHorizontal className="size-3.5" />
    </div>
  </span>
);

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
              trailing={<AgentActions />}
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