/**
 * Non-expandable accordion header — styled like AccordionItem but static.
 */
import type { ReactNode } from 'react';

export type AccordionHeaderProps = {
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

/**
 * Non-expandable accordion header — styled like AccordionItem but static.
 * @param label - Section label
 * @param icon - Optional icon node
 * @param badge - Optional badge node
 * @param active - Whether section is currently active
 * @param onClick - Called when header is clicked
 */
export function AccordionHeader({ label, icon, badge, active = false, onClick }: AccordionHeaderProps) {
  return (
    <div className="px-2 py-0.5">
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        }`}
      >
        <span className="shrink-0" style={{ width: 12, display: 'inline-block' }} />
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-left">{label}</span>
        {badge && <span className="shrink-0">{badge}</span>}
      </button>
    </div>
  );
}
