import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type DropdownTriggerProps = {
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`no-drag flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-md transition-colors ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';
