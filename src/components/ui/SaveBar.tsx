/**
 * SaveBar — sticky or inline save/cancel bar for forms with dirty state.
 * Two variants: 'sticky' (settings pages with backdrop-blur) and 'inline' (right-auxiliary manage tabs).
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type SaveBarProps = {
  /** Whether the form is dirty. When false, the bar renders nothing. */
  isDirty?: boolean;
  /** Alternative: pass `disabled` directly (right-auxiliary pattern). */
  disabled?: boolean;
  /** Called when Save is clicked. */
  onSave: () => void;
  /** Called when Cancel is clicked. */
  onCancel: () => void;
  /** Label for save button. */
  saveLabel?: string;
  /** Label for cancel button. */
  cancelLabel?: string;
  /** Left-side message (e.g. "Unsaved changes"). Only shown when variant is 'sticky'. */
  message?: string;
  /** Layout variant. */
  variant?: 'sticky' | 'inline';
};

/**
 * Save/Cancel bar for forms with dirty state.
 * @param isDirty - Whether the form is dirty; only renders when true (sticky variant)
 * @param disabled - When true, Save is disabled (inline variant)
 * @param onSave - Called when Save is clicked
 * @param onCancel - Called when Cancel is clicked
 * @param saveLabel - Save button label (default "Save" for inline, "Save changes" for sticky)
 * @param cancelLabel - Cancel button label (default "Cancel")
 * @param message - Left-side text shown in sticky variant (default "Unsaved changes")
 * @param variant - Layout: 'sticky' (default, with backdrop-blur) or 'inline' (border-t, no sticky)
 */
export function SaveBar({
  isDirty,
  disabled,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel = 'Cancel',
  message = 'Unsaved changes',
  variant = 'sticky',
}: SaveBarProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    if (variant === 'inline') {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  const resolvedSaveLabel =
    saveLabel ?? (variant === 'inline' ? (saved ? 'Saved' : 'Save') : 'Save changes');

  if (variant === 'sticky' && !isDirty) return null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-sidebar shrink-0">
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={disabled}
          className="bg-chart-1 text-highlight-foreground hover:bg-chart-1/90"
        >
          {resolvedSaveLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{message}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          {resolvedSaveLabel}
        </Button>
      </div>
    </div>
  );
}