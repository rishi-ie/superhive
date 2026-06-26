/**
 * Select — accessible dropdown using @radix-ui/react-select.
 * Wraps Radix SelectTrigger + SelectContent + SelectItem for a consistent API.
 */
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

export type SelectOption = {
  label: string;
  value: string | number;
};

export type SelectProps = {
  value?: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
};

/**
 * Accessible dropdown select with Radix.
 * @param value - Currently selected value
 * @param options - Array of { label, value } options
 * @param onChange - Callback when selection changes
 * @param placeholder - Placeholder text when nothing is selected
 * @param className - Additional CSS classes
 * @param size - Select trigger size: sm or md
 */
export function Select({ value, options, onChange, placeholder = 'Select...', className = '', size = 'md' }: SelectProps) {
  const heightClass = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm';

  return (
    <SelectPrimitive.Root value={String(value)} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          heightClass,
          '[&>span]:line-clamp-1',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={14} strokeWidth={STROKE_WIDTH} className="shrink-0 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map(opt => (
              <SelectPrimitive.Item
                key={opt.value}
                value={String(opt.value)}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
              >
                <span className="absolute left-2 flex size-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check size={12} strokeWidth={STROKE_WIDTH} />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
