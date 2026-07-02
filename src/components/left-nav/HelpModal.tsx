/**
 * Help content modal — shown when a user picks Documentation or Changelog
 * from the Help popover. Currently displays "Coming soon" content.
 */
import { Book, Sparkles, X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type HelpModalProps = {
  section: 'docs' | 'changelog' | null;
  onClose: () => void;
};

const CONTENT = {
  docs: {
    icon: Book,
    title: 'Documentation',
    body: 'Superhive docs are coming soon. In the meantime, use ⌘K to open the command palette and ⌘? for shortcuts.',
  },
  changelog: {
    icon: Sparkles,
    title: 'Changelog',
    body: 'Release notes are coming soon. Stay tuned for updates.',
  },
} as const;

/**
 * Small in-app modal showing "Coming soon" content for help items.
 * @param section - Which help section to show, or null when closed
 * @param onClose - Called when the modal should close
 */
export function HelpModal({ section, onClose }: HelpModalProps) {
  if (!section) return null;
  const { icon: Icon, title, body } = CONTENT[section];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-lg shadow-xl max-w-sm w-full mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={18} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} strokeWidth={STROKE_WIDTH} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
