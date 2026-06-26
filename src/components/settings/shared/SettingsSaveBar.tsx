/**
 * Sticky save/cancel bar for settings pages.
 * Only renders when there are unsaved changes.
 */
import { Button } from '@/components/ui/Button';

type SettingsSaveBarProps = {
  isDirty: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  discardLabel?: string;
  message?: string;
};

/**
 * Sticky bottom save/cancel bar for settings pages with dirty state.
 * @param isDirty - Whether there are unsaved changes
 * @param onDiscard - Called when Discard is clicked
 * @param onSave - Called when Save is clicked
 * @param saveLabel - Label for save button (default "Save changes")
 * @param discardLabel - Label for discard button (default "Discard")
 * @param message - Message shown on the left (default "Unsaved changes")
 */
export function SettingsSaveBar({
  isDirty,
  onDiscard,
  onSave,
  saveLabel = 'Save changes',
  discardLabel = 'Discard',
  message = 'Unsaved changes',
}: SettingsSaveBarProps) {
  if (!isDirty) return null;
  return (
    <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{message}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          {discardLabel}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
