/**
 * Styled text input with size and error state options.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'sm' | 'md';
  error?: boolean;
  className?: string;
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
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
        className={`w-full rounded-md border bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar disabled:opacity-50 disabled:pointer-events-none transition-colors ${
          error
            ? 'border-destructive focus-visible:ring-destructive/40'
            : 'border-border'
        } ${sizeClasses[size]} text-foreground placeholder:text-muted-foreground ${className}`}
        {...rest}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
