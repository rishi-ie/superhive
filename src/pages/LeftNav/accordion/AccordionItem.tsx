/**
 * Expandable accordion item with animated chevron and optional badge.
 */
import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

export type AccordionItemProps = {
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
  onClick?: () => void;
  children?: ReactNode;
};

/**
 * Expandable accordion item with animated chevron and optional badge.
 * @param label - Section label
 * @param icon - Optional icon node
 * @param badge - Optional badge node (e.g., "Coming soon")
 * @param defaultOpen - Whether section starts expanded
 * @param active - Whether section is currently active
 * @param onClick - Called when header is clicked
 * @param children - Nested content when expanded
 */
export function AccordionItem({ label, icon, badge, defaultOpen = false, active = false, onClick, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="px-2 py-0.5">
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        }`}
      >
        <button
          onClick={handleChevronClick}
          className="shrink-0 p-0.5 hover:bg-sidebar-accent/50 rounded transition-colors"
          aria-label="Toggle expand"
        >
          <ChevronRight
            size={12}
            strokeWidth={STROKE_WIDTH}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-left">{label}</span>
        {badge && <span className="shrink-0">{badge}</span>}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-4 pt-0.5 space-y-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
