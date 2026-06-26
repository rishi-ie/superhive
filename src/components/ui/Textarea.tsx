/**
 * Styled textarea with size and error state options.
 */
import { forwardRef, type TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: 'sm' | 'md';
  error?: boolean;
  className?: string;
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
};

/**
 * Styled textarea matching TextInput visual style.
 * @param size - Textarea size: sm or md (default)
 * @param error - Applies error styling (red border/ring)
 * @param className - Additional CSS classes
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = 'md', error = false, className = '', ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error}
        className={`flex w-full resize-none rounded-md border bg-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          error
            ? 'border-destructive focus-visible:ring-destructive/40'
            : 'border-border'
        } ${sizeClasses[size]} text-foreground placeholder:text-muted-foreground ${className}`}
        {...rest}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
