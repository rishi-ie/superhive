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
  openLeadingIcon?: ReactNode;
  trailing?: ReactNode;
  hoverActions?: ReactNode;
}

export function AccordionSection({
  label,
  defaultOpen = false,
  children,
  onClick,
  labelClassName,
  leadingIcon,
  openLeadingIcon,
  trailing,
  hoverActions,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleClick = () => {
    if (onClick) onClick();
    setOpen((o) => !o);
  };

  return (
    <div className="flex flex-col">
      <div className="group/project relative rounded-card hover:bg-sidebar-accent-l">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'flex h-8 w-full cursor-default items-center gap-stack rounded-card px-row text-sm font-medium transition-colors',
            labelClassName || 'text-sidebar-btn-text-l'
          )}
        >
          {leadingIcon && <div className="size-4 flex-shrink-0">{open && openLeadingIcon ? openLeadingIcon : leadingIcon}</div>}
          <span className="flex-1 truncate text-left">{label}</span>
          <div className={cn('mr-2 flex size-5 shrink-0 items-center justify-center', hoverActions && 'group-hover/project:hidden')}>{trailing}</div>
          {!leadingIcon && <Icon icon={CaretRightIcon} className={cn('size-4 flex-shrink-0 transition-transform duration-150', open && 'rotate-90')} />}
        </button>

        {hoverActions && <div className="absolute right-1 top-1 hidden items-center gap-0.5 group-hover/project:flex">{hoverActions}</div>}
      </div>

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
