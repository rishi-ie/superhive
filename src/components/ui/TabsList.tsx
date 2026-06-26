/**
 * Tabs list — container for tab triggers.
 */
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Tabs list — container for tab triggers.
 * @param children - TabsTrigger components
 * @param className - Additional CSS classes
 */
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}
