/**
 * Compact toggleable pill button for filters and tags.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type PillSize = 'sm' | 'md' | 'lg';

type PillProps = {
  active?: boolean;
  size?: PillSize;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/**
 * Compact toggleable pill button for filters and tags.
 * @param active - Whether the pill is in active/selected state
 * @param className - Additional CSS classes
 * @param children - Pill content
 */
const sizeMap: Record<PillSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Compact toggleable pill button for filters and tags.
 * @param active - Whether the pill is in active/selected state
 * @param size - Pill size: sm, md (default), or lg
 * @param className - Additional CSS classes
 * @param children - Pill content
 */
export const Pill = forwardRef<HTMLButtonElement, PillProps>(
  ({ active = false, size = 'md', className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        aria-pressed={active}
        className={`flex items-center gap-1.5 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${
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
