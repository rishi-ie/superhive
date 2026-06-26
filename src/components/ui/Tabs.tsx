/**
 * Tabs component using Radix UI for accessible keyboard navigation.
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

type TabsContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

/**
 * Tabs root — wraps Tabs.List and Tabs.Content.
 * @param defaultValue - Default active tab value
 * @param value - Controlled active tab value
 * @param onValueChange - Callback when tab changes
 * @param children - Tabs.List and Tabs.Content children
 */
export function Tabs({ defaultValue, value, onValueChange, children, className = '' }: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {children}
    </RadixTabs.Root>
  );
}

/**
 * Tabs list — container for tab triggers.
 * @param children - Tab trigger buttons
 * @param className - Additional CSS classes
 */
export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <RadixTabs.List className={`flex items-center gap-1 ${className}`}>
      {children}
    </RadixTabs.List>
  );
}

/**
 * Tab trigger — a single selectable tab.
 * @param value - The value this tab represents
 * @param children - Tab label
 * @param className - Additional CSS classes
 * @param disabled - Prevents tab selection
 */
export function TabsTrigger({ value, children, className = '', disabled = false }: TabsTriggerProps) {
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

/**
 * Tab content panel — shown when the corresponding tab is active.
 * @param value - The value matching the trigger
 * @param children - Tab panel content
 * @param className - Additional CSS classes
 */
export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  return (
    <RadixTabs.Content value={value} className={className}>
      {children}
    </RadixTabs.Content>
  );
}
