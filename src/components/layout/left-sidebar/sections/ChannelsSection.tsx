import { Hash } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { AccordionRow } from '../primitives/AccordionRow';

interface ChannelItem {
  id: string;
  name: string;
}

interface ChannelsSectionProps {
  items: ChannelItem[];
}

export function ChannelsSection({ items }: ChannelsSectionProps) {
  return (
    <AccordionSection label="Channels">
      {items.map((c) => (
        <AccordionRow
          key={c.id}
          icon={<Hash className="size-4 flex-shrink-0" />}
          label={c.name}
        />
      ))}
    </AccordionSection>
  );
}
