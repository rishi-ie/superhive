import { HugeiconsIcon } from "@/components/ui/icon";
import { PinIcon } from "@hugeicons/core-free-icons";
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
          icon={<HugeiconsIcon icon={PinIcon} className="size-4 flex-shrink-0" />}
          label={p.name}
        />
      ))}
    </AccordionSection>
  );
}
