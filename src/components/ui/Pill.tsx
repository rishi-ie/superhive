/**
 * Compact toggleable pill button for filters and tags.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type PillProps = {
  active?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/**
 * Compact toggleable pill button for filters and tags.
 * @param active - Whether the pill is in active/selected state
 * @param className - Additional CSS classes
 * @param children - Pill content
 */
export const Pill = forwardRef<HTMLButtonElement, PillProps>(
  ({ active = false, className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          active
            ? "bg-chart-1 text-highlight-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-tertiary"
        } ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Pill.displayName = "Pill";
