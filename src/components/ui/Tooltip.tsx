/**
 * Tooltip using Radix UI for accessible hover tooltips.
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
};

/**
 * Tooltip wrapper — pairs a trigger with a floating tooltip.
 * @param children - The interactive trigger element
 * @param content - The tooltip content (string or JSX)
 * @param side - Preferred placement: top, right, bottom, or left
 * @param delayDuration - Hover delay before showing (ms)
 */
export function Tooltip({ children, content, side = 'top', delayDuration = 400 }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={4}
          className="z-50 max-w-xs rounded-md border border-border bg-sidebar px-2.5 py-1.5 text-xs text-sidebar-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {content}
          <RadixTooltip.Arrow className="text-border" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
