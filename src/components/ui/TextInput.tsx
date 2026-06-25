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
    const errorClasses = error ? 'border-destructive ring-destructive' : 'border-border ring-ring focus:ring-1 focus:ring-ring';

    return (
      <input
        ref={ref}
        className={`w-full rounded-md border bg-input ${sizeClasses[size]} text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:pointer-events-none transition-colors ${errorClasses} ${className}`}
        {...rest}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
