import { Hash } from 'lucide-react';
import { AccordionSection, AccordionRow } from '@/components/layout/common/primitives';

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
