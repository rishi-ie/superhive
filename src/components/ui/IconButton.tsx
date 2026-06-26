/**
 * Square icon-only button with ghost/solid/outline variants.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export type IconButtonVariant = 'ghost' | 'solid' | 'outline';

type IconButtonProps = {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

const sizeMap: Record<IconButtonSize, string> = {
  xs: 'size-6 [&_svg]:size-3',
  sm: 'size-7 [&_svg]:size-3.5',
  md: 'size-7 [&_svg]:size-4',
  lg: 'size-8 [&_svg]:size-4',
};

const variantMap: Record<IconButtonVariant, string> = {
  ghost:
    'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
  solid:
    'bg-chart-1 text-highlight-foreground hover:bg-chart-1/90',
  outline:
    'border border-border bg-secondary text-foreground hover:bg-tertiary',
};

/**
 * Square icon-only button with size and variant options.
 * @param size - Button size: xs, sm, md, or lg
 * @param variant - Visual style: ghost, solid, or outline
 * @param className - Additional CSS classes
 * @param children - Icon element(s)
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`no-drag flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
