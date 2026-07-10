import { Icon } from "@/components/ui/icon";
import { PushPinIcon } from "@phosphor-icons/react";
import { AccordionSection, AccordionRow } from '@/components/layout/common/primitives';

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
          icon={<Icon icon={PushPinIcon} className="size-4 flex-shrink-0" />}
          label={p.name}
        />
      ))}
    </AccordionSection>
  );
}
