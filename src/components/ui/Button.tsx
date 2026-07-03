/**
 * Reusable button with variant and size options, plus loading spinner.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:     'bg-accent text-highlight-foreground hover:bg-accent/90 active:bg-accent/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:    'border border-border bg-secondary text-foreground hover:bg-tertiary active:bg-tertiary-active',
        secondary:  'bg-secondary text-secondary-foreground hover:bg-tertiary',
        ghost:      'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 active:bg-sidebar-accent',
        link:       'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm:  'h-7 px-3 text-xs',
        md:  'h-9 px-4 text-sm',
        lg:  'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type ButtonProps = {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'className' | 'children'>;

/**
 * Reusable button with variant and size options, plus loading spinner.
 * @param variant - Visual style: default (solid), destructive, outline, secondary, ghost, or link
 * @param size - Button size: sm, md, lg, or icon
 * @param loading - Shows spinner and disables the button
 * @param asChild - Use Slot to merge props onto the child element
 * @param className - Additional CSS classes
 * @param children - Button label or content
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', loading = false, asChild = false, disabled, className = '', children, ...rest }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
