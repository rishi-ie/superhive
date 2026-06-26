/**
 * Tab trigger — a single selectable tab.
 * @param value - The value this tab represents
 * @param children - Tab label
 * @param className - Additional CSS classes
 * @param disabled - Prevents tab selection
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

export function TabsTrigger({ value, children, className = '', disabled = false }: {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <RadixTabs.Trigger
      value={value}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </RadixTabs.Trigger>
  );
}
