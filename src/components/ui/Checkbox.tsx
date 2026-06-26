/**
 * Checkbox — accessible checkbox using @radix-ui/react-checkbox.
 */
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

export type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Accessible checkbox with check indicator.
 * @param checked - Controlled checked state
 * @param onCheckedChange - Callback when checked state changes
 * @param disabled - Prevents interaction
 * @param size - Checkbox size: sm (14px) or md (16px, default)
 * @param className - Additional CSS classes
 */
export function Checkbox({ checked = false, onCheckedChange, disabled = false, size = 'md', className = '' }: CheckboxProps) {
  const boxSize = size === 'sm' ? 'size-3.5' : 'size-4';

  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        `${boxSize} shrink-0 rounded border border-border bg-input hover:border-muted-foreground/60 data-[state=checked]:bg-chart-1 data-[state=checked]:border-chart-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed`,
        className
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-highlight-foreground">
        <Check size={size === 'sm' ? 9 : 11} strokeWidth={STROKE_WIDTH * 1.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
