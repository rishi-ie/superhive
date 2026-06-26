/**
 * Tab trigger — individual tab button.
 */
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

/**
 * Tab trigger — individual tab button.
 * @param value - The tab value this trigger activates
 * @param children - Tab label content
 * @param className - Additional CSS classes
 * @param disabled - Prevents tab selection
 */
export function TabsTrigger({ value, children, className = '', disabled = false }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}
