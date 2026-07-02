/**
 * Help popover anchored to the help button — docs, changelog, shortcuts.
 * "Shortcuts" item dispatches a window event that the Dashboard listens for
 * to open the command palette.
 */
import { useEffect, useRef } from 'react';
import { Book, Sparkles, Command } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type HelpPopoverProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onHelpSelect: (id: 'docs' | 'changelog') => void;
  onSetupWizard?: () => void;
};

const items = [
  { id: 'docs',          label: 'Documentation',  Icon: Book },
  { id: 'changelog',     label: 'Changelog',      Icon: Sparkles },
  { id: 'shortcuts',     label: 'Shortcuts',      Icon: Command, shortcutHint: 'palette.open' },
  { id: 'setupwizard',   label: 'Setup wizard',   Icon: Sparkles },
];

function handleItem(
  id: string,
  onHelpSelect: (id: 'docs' | 'changelog') => void,
  onSetupWizard?: () => void,
) {
  if (id === 'shortcuts') {
    window.dispatchEvent(new CustomEvent('app:open-command-palette'));
    return;
  }
  if (id === 'setupwizard') {
    sessionStorage.removeItem('wizard:setup:dismissed');
    onSetupWizard?.();
    return;
  }
  if (id === 'docs' || id === 'changelog') {
    onHelpSelect(id);
  }
}

/**
 * Help popover anchored to the help button — docs, changelog, shortcuts.
 * @param anchorRef - Ref to the element to anchor the popover to
 * @param open - Whether the popover is visible
 * @param onClose - Called when popover should close
 * @param onHelpSelect - Called when docs or changelog item is selected
 */
export function HelpPopover({ anchorRef, open, onClose, onHelpSelect, onSetupWizard }: HelpPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full right-0 mb-2 z-50 min-w-[180px] rounded-md border border-sidebar-border bg-popover py-1 shadow-md"
    >
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => { handleItem(id, onHelpSelect, onSetupWizard); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
        >
          <Icon size={14} strokeWidth={STROKE_WIDTH} className="shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {id === 'shortcuts' && (
            <kbd className="font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          )}
        </button>
      ))}
    </div>
  );
}
