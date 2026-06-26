/**
 * Reusable card for universal list items with optional click and selection states.
 */
import type { ReactNode, HTMLAttributes } from 'react';

type UniversalListCardProps = HTMLAttributes<HTMLDivElement> & {
  onClick?: () => void;
  selected?: boolean;
  children: ReactNode;
};

/**
 * Reusable card for universal list items with optional click and selection states.
 * @param onClick - Optional click handler (renders as button when provided)
 * @param selected - Applies selected/active border styling
 * @param children - Card content
 */
export function UniversalListCard({ onClick, selected, children, className = '', ...rest }: UniversalListCardProps) {
  const baseClasses = 'rounded-md border bg-card transition-colors';
  const borderClasses = selected ? 'border-chart-1' : 'border-border hover:border-border/80';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${borderClasses} p-3 w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${borderClasses} p-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`} {...rest}>
      {children}
    </div>
  );
}
