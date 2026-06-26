/**
 * Tab content panel — shown when the corresponding tab is active.
 * @param value - The value matching the trigger
 * @param children - Tab panel content
 * @param className - Additional CSS classes
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

export function TabsContent({ value, children, className = '' }: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Content value={value} className={className}>
      {children}
    </RadixTabs.Content>
  );
}
