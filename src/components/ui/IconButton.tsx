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

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`no-drag flex items-center justify-center rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
