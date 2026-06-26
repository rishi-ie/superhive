/**
 * Tooltip provider — wraps the application to enable tooltips globally.
 */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export type TooltipProviderProps = {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
};

/**
 * Tooltip provider — wrap your app root to enable accessible tooltips.
 * @param children - App content
 * @param delayDuration - Hover delay before showing (ms, default 400)
 * @param skipDelayDuration - Delay for subsequent tooltips (ms)
 */
export function TooltipProvider({ children, delayDuration = 400, skipDelayDuration = 0 }: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}
