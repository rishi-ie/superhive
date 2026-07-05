import { Bot, Plus } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { AccordionRow } from '../primitives/AccordionRow';
import { EmptyCtaButton } from '../primitives/EmptyCtaButton';

interface AgentItem {
  id: string;
  name: string;
}

interface AgentsSectionProps {
  items: AgentItem[];
}

export function AgentsSection({ items }: AgentsSectionProps) {
  return (
    <AccordionSection label="Agents">
      {items.length > 0
        ? items.map((a) => (
            <AccordionRow
              key={a.id}
              icon={<Bot className="size-4 flex-shrink-0" />}
              label={a.name}
            />
          ))
        : <EmptyCtaButton icon={<Plus className="size-4 flex-shrink-0" />} label="New agent" />}
    </AccordionSection>
  );
}
