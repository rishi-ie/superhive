/**
 * Styled text input with size and error state options.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'sm' | 'md';
  error?: boolean;
  className?: string;
};

const sizeClasses: Record<string, string> = {
  sm: 'h-7 px-2.5 py-1.5 text-xs',
  md: 'h-9 px-3 py-2 text-sm',
};

/**
 * Styled text input with size and error state options.
 * @param size - Input size: sm or md
 * @param error - Applies error styling (red border/ring)
 * @param className - Additional CSS classes
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ size = 'md', error = false, className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={error}
        className={cn(
          'flex w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          error ? 'border-destructive focus-visible:ring-destructive/40' : 'border-border',
          sizeClasses[size],
          className
        )}
        {...rest}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
