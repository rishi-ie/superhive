/**
 * Reusable button with variant (solid/outline/ghost) and size (sm/md/lg) options.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

const variantMap: Record<ButtonVariant, string> = {
  solid: 'bg-chart-1 text-highlight-foreground hover:bg-chart-1/90 active:bg-chart-1/80',
  outline: 'border border-border bg-secondary text-foreground hover:bg-tertiary active:bg-tertiary-active',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 active:bg-sidebar-accent',
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

/**
 * Reusable button with variant and size options, plus loading spinner.
 * @param variant - Visual style: solid, outline, or ghost
 * @param size - Button size: sm, md, or lg
 * @param loading - Shows spinner and disables the button
 * @param className - Additional CSS classes
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'solid', size = 'md', loading = false, disabled, className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantMap[variant]} ${sizeMap[size]} ${className}`}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
