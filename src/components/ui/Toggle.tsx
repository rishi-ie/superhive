/**
 * Toggle switch with animated knob for boolean settings.
 * Uses @radix-ui/react-switch for accessible toggle behavior.
 */
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
};

/**
 * Toggle switch with animated knob for boolean settings.
 * @param checked - Current toggle state
 * @param onChange - Callback when toggle state changes
 * @param size - Toggle size: sm or md
 * @param disabled - Prevents interaction when true
 * @param className - Additional CSS classes
 */
export function Toggle({ checked, onChange, size = 'md', disabled = false, className = '' }: ToggleProps) {
  const knobTranslate = checked
    ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
    : 'translate-x-0.5';
  const knobSize = size === 'sm' ? 'size-3' : 'size-4';

  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className={cn(
        switchVariants({ size }),
        checked ? 'bg-chart-1 border-chart-1' : 'bg-input border-border',
        className
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm transition-transform',
          knobSize,
          knobTranslate,
          'mt-0.5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}
