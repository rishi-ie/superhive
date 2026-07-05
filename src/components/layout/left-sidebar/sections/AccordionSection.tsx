import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  label,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#727272] transition-colors"
      >
        <span className="truncate text-left">{label}</span>
        <ChevronRight
          className={cn(
            'size-4 flex-shrink-0 transition-transform duration-150',
            open && 'rotate-90'
          )}
        />
      </button>

      <div
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-150 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 pl-2">
          <div className="flex flex-col gap-0.5 py-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
