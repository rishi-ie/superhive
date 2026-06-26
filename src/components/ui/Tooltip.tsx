/**
 * Tooltip — accessible hover tooltip using @radix-ui/react-tooltip.
 */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  className?: string;
};

/**
 * Tooltip wrapper — pairs a trigger with a floating tooltip.
 * Requires TooltipProvider ancestor.
 * @param children - The interactive trigger element
 * @param content - The tooltip content (string or JSX)
 * @param side - Preferred placement: top, right, bottom, or left
 * @param delayDuration - Hover delay before showing (ms, default 400)
 * @param className - Additional CSS classes for the content
 */
export function Tooltip({ children, content, side = 'top', delayDuration = 400, className = '' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          className={cn(
            'z-50 overflow-hidden rounded-md bg-sidebar px-3 py-1.5 text-xs text-sidebar-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="text-sidebar border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
