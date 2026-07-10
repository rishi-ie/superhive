import * as React from 'react';
import { HugeiconsIcon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon, Copy01Icon } from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  showCopy?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, showCopy = true, value, ...props }, ref) {
    const [revealed, setRevealed] = React.useState(false);
    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    const handleCopy = React.useCallback(async () => {
      const text = String(value ?? '');
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Failed to copy');
      }
    }, [value]);

    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          type={revealed ? 'text' : 'password'}
          value={value}
          className="pr-16"
          {...props}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showCopy && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground cursor-default"
              onClick={handleCopy}
              disabled={!hasValue}
              aria-label="Copy value"
            >
              <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground cursor-default"
            onClick={() => setRevealed((r) => !r)}
            disabled={!hasValue}
            aria-label={revealed ? 'Hide value' : 'Reveal value'}
          >
            <HugeiconsIcon
              icon={revealed ? ViewOffIcon : ViewIcon}
              className="size-3.5"
            />
          </Button>
        </div>
      </div>
    );
  },
);