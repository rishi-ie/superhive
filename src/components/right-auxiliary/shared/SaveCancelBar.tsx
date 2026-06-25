/**
 * Sticky Save/Cancel bar for Manage tabs.
 * Only renders when there are pending changes.
 */
import { useState } from 'react';

type SaveCancelBarProps = {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
};

/**
 * Sticky Save/Cancel bar for Manage tabs.
 * @param onSave - Called when Save is clicked
 * @param onCancel - Called when Cancel is clicked
 * @param disabled - If true, Save is disabled
 */
export function SaveCancelBar({ onSave, onCancel, disabled }: SaveCancelBarProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-sidebar shrink-0">
      <button
        type="button"
        onClick={handleSave}
        disabled={disabled}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-chart-1 text-highlight-foreground hover:bg-chart-1/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saved ? 'Saved' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
