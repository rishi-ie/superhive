/**
 * Tab content — panel shown when tab is active.
 */
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Tab content — panel shown when tab is active.
 * @param value - The tab value this content belongs to
 * @param children - Tab panel content
 * @param className - Additional CSS classes
 */
export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
