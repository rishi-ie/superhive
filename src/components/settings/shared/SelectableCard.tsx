/**
 * Selectable card — bordered tile for picking a single option from a grid.
 * Used in settings pages for theme, engine, and similar pickers.
 */
import type { ReactNode } from 'react';

type SelectableCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
};

/**
 * Selectable card — a bordered tile used for picking a single option from a grid.
 * Renders as a button when onClick is provided, otherwise as a div.
 * @param title - Card title
 * @param description - Optional subtitle
 * @param icon - Optional leading icon
 * @param selected - Applies selected border and background tint
 * @param onClick - Click handler (makes the card interactive)
 * @param children - Optional extra content
 * @param className - Additional CSS classes
 */
export function SelectableCard({
  title,
  description,
  icon,
  selected = false,
  onClick,
  children,
  className = '',
}: SelectableCardProps) {
  const baseClasses = 'rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  const stateClasses = selected
    ? 'border-accent/60 bg-accent/5'
    : 'border-border/40 bg-card/30 hover:border-border/80 hover:bg-card/50';

  const content = (
    <>
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{title}</span>
        {description && (
          <span className="text-[10px] text-muted-foreground truncate">{description}</span>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${stateClasses} p-3 w-full text-left flex items-center gap-3 ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${stateClasses} p-3 flex items-center gap-3 ${className}`}>
      {content}
    </div>
  );
}