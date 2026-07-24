import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from "@/components/ui/icon";
import { CaretRightIcon } from "@phosphor-icons/react";
import { cn } from '@/lib/utils';

interface AccordionSectionProps {
  label: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  labelClassName?: string;
  leadingIcon?: ReactNode;
  swapLeadingOnHover?: boolean;
}

export function AccordionSection({
  label,
  defaultOpen = false,
  children,
  onClick,
  labelClassName,
  leadingIcon,
  swapLeadingOnHover = false,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (onClick) onClick();
    setOpen((o) => !o);
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'flex h-8 w-full cursor-default items-center gap-stack rounded-card px-row text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-btn-text-hover',
          labelClassName || 'text-sidebar-btn-text'
        )}
      >
        {swapLeadingOnHover ? (
          <>
            <div className="size-4 flex-shrink-0">
              {hovered ? (
                <Icon
                  icon={CaretRightIcon}
                  className={cn(
                    'size-4 transition-transform duration-150',
                    open && 'rotate-90'
                  )}
                />
              ) : (
                leadingIcon
              )}
            </div>
            <span className="truncate text-left">{label}</span>
          </>
        ) : (
          <>
            {leadingIcon}
            <span className="truncate text-left">{label}</span>
            <Icon
              icon={CaretRightIcon}
              className={cn(
                'size-4 flex-shrink-0 transition-transform duration-150',
                open && 'rotate-90'
              )}
            />
          </>
        )}
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