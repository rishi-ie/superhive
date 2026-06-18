import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type NavItemProps = {
  active?: boolean;
  icon: ReactNode;
  label: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(
  ({ active = false, icon, label, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        } ${className}`}
        {...rest}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  }
);

NavItem.displayName = 'NavItem';
