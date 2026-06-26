/**
 * Tabs list — container for tab triggers.
 * @param children - Tab trigger buttons
 * @param className - Additional CSS classes
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <RadixTabs.List className={`flex items-center gap-1 ${className}`}>
      {children}
    </RadixTabs.List>
  );
}
