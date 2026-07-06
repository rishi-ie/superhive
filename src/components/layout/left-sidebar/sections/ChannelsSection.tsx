import { HugeiconsIcon } from "@/components/ui/icon";
import { HashtagIcon } from "@hugeicons/core-free-icons";
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
          icon={<HugeiconsIcon icon={HashtagIcon} className="size-4 flex-shrink-0" />}
          label={c.name}
        />
      ))}
    </AccordionSection>
  );
}
