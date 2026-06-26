/**
 * Tabs component using Radix UI for accessible keyboard navigation.
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

/**
 * Tabs root — wraps Tabs.List and Tabs.Content.
 * @param defaultValue - Default active tab value
 * @param value - Controlled active tab value
 * @param onValueChange - Callback when tab changes
 * @param children - Tabs.List and Tabs.Content children
 * @param className - Additional CSS classes
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
