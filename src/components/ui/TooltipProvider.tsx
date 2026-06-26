/**
 * Tooltip provider — wrap the app or relevant subtree once.
 * @param children - The wrapped subtree
 * @param delayDuration - Hover delay before showing (ms)
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export function TooltipProvider({ children, delayDuration = 300 }: { children: ReactNode; delayDuration?: number }) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      {children}
    </RadixTooltip.Provider>
  );
}
