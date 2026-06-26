/**
 * Confirmation modal — standard confirm or type-to-confirm for destructive actions.
 */
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

type ConfirmationModalProps = {
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
 * @param title - Modal title
 * @param description - Modal description
 * @param confirmLabel - Label on confirm button (default "Confirm")
 * @param destructive - If true, confirm button is red
 * @param confirmText - Text user must type to enable confirm (type-to-confirm pattern)
 * @param onConfirm - Called when confirmed
 * @param onCancel - Called when cancelled
 */
export function ConfirmationModal({
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  confirmText,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [input, setInput] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  const canConfirm = destructive && confirmText
    ? input === confirmText
    : !destructive;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    firstFocusRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        aria-describedby="cm-desc"
        className="relative z-10 w-full max-w-sm mx-4 bg-sidebar border border-border rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex items-start gap-3 p-4">
          {destructive && (
            <AlertTriangle
              size={18}
              strokeWidth={STROKE_WIDTH}
              className="text-chart-5 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 id="cm-title" className="text-sm font-semibold text-foreground">{title}</h3>
            <p id="cm-desc" className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        {destructive && confirmText && (
          <div className="px-4 pb-4">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider" htmlFor="cm-input">
              Type &quot;{confirmText}&quot; to confirm
            </label>
            <TextInput
              id="cm-input"
              ref={firstFocusRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={confirmText}
              className="mt-1"
            />
          </div>
        )}

        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? 'outline' : 'solid'}
            size="sm"
            className="flex-1"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
