/**
 * Confirmation modal — standard confirm or type-to-confirm for destructive actions.
 * Backed by shadcn Dialog (Radix) for proper focus management and a11y.
 */
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Label } from '@/components/ui/Label';

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmation modal with optional type-to-confirm for destructive actions.
 * @param open - Whether the modal is visible
 * @param title - Modal title
 * @param description - Modal description
 * @param confirmLabel - Label on confirm button (default "Confirm")
 * @param destructive - If true, confirm button is red
 * @param confirmText - Text user must type to enable confirm (type-to-confirm pattern)
 * @param onConfirm - Called when confirmed
 * @param onCancel - Called when cancelled
 */
export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  confirmText,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [input, setInput] = useState('');

  const canConfirm = destructive && confirmText ? input === confirmText : !destructive;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setInput('');
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <AlertTriangle
                size={18}
                strokeWidth={STROKE_WIDTH}
                className="text-chart-5 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {destructive && confirmText && (
          <div className="space-y-1.5">
            <Label
              htmlFor="cm-input"
              className="text-[10px] text-muted-foreground uppercase tracking-wider font-normal"
            >
              Type &quot;{confirmText}&quot; to confirm
            </Label>
            <TextInput
              id="cm-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={confirmText}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant={destructive ? 'outline' : 'default'}
            disabled={!canConfirm}
            onClick={() => {
              setInput('');
              onConfirm();
            }}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
