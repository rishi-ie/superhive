/**
 * Sticky bottom utilities bar — settings and help popover.
 */
import { useRef, useState } from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { HelpPopover } from './HelpPopover';
import { HelpModal } from '@/modals/HelpModal';

type UtilitiesProps = {
  onSettingsClick?: () => void;
  onSetupWizard?: () => void;
};

/**
 * Sticky bottom utilities bar — settings and help popover.
 * @param onSettingsClick - Called when settings button is clicked
 * @param onSetupWizard - Called to re-open the setup wizard
 */
export function Utilities({ onSettingsClick, onSetupWizard }: UtilitiesProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<'docs' | 'changelog' | null>(null);
  const helpBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mt-auto border-t border-sidebar-border px-2 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onSettingsClick}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Settings size={16} strokeWidth={STROKE_WIDTH} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </button>

        <div className="relative">
          <button
            ref={helpBtnRef}
            onClick={() => setHelpOpen(!helpOpen)}
            aria-label="Help and resources"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <HelpCircle size={16} strokeWidth={STROKE_WIDTH} className="shrink-0" />
          </button>
          <HelpPopover
            anchorRef={helpBtnRef}
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            onHelpSelect={setHelpSection}
            onSetupWizard={onSetupWizard}
          />
        </div>
      </div>
      <HelpModal
        section={helpSection}
        onClose={() => setHelpSection(null)}
      />
    </div>
  );
}