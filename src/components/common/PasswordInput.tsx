import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { EyeIcon, EyeSlashIcon, CopyIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { copyText } from '@/flows/ui/copy-text';
import { cn } from '@/lib/utils';

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  showCopy?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, showCopy = true, value, ...props }, ref) {
    const [revealed, setRevealed] = React.useState(false);
    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    const handleCopy = React.useCallback(() => {
      const text = String(value ?? '');
      if (!text) return;
      void copyText(text);
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
              <Icon icon={CopyIcon} className="size-3.5" />
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
            <Icon
              icon={revealed ? EyeSlashIcon : EyeIcon}
              className="size-3.5"
            />
          </Button>
        </div>
      </div>
    );
  },
);