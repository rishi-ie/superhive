import { Pin } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { AccordionRow } from '../primitives/AccordionRow';

interface PinnedItem {
  id: string;
  name: string;
}

interface PinnedSectionProps {
  items: PinnedItem[];
}

export function PinnedSection({ items }: PinnedSectionProps) {
  if (items.length === 0) return null;

  return (
    <AccordionSection label="Pinned">
      {items.map((p) => (
        <AccordionRow
          key={p.id}
          icon={<Pin className="size-4 flex-shrink-0" />}
          label={p.name}
        />
      ))}
    </AccordionSection>
  );
}
