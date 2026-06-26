/**
 * Switch — on/off toggle using @radix-ui/react-switch.
 * Tuned for warm dark theme: terracotta accent on-state, visible off-state pill,
 * smaller thumb so track color shows on both sides, bright focus ring.
 */
import React, { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
      'border border-border/60',
      'transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=unchecked]:bg-switch-track-off',
      'data-[state=checked]:bg-highlight',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-3.5 w-3.5 rounded-full bg-background',
        'shadow-[var(--switch-thumb-shadow)]',
        'ring-0 transition-transform duration-200',
        'translate-x-[3px] data-[state=checked]:translate-x-[19px]'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };