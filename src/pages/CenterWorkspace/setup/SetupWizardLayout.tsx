/**
 * SetupWizardLayout — shared centered hero block for all setup wizards.
 * Pure presentational component — no logic, no state.
 */
import type { MenuRow } from './SetupMenuList';
import { SetupMenuList } from './SetupMenuList';

type SetupWizardLayoutProps = {
  eyebrow: string;
  title: string;
  lead: string;
  rows: readonly MenuRow[];
  footerHint?: string;
};

/**
 * Centered hero block layout used by all setup wizards.
 * @param eyebrow - Small uppercase label above the title (e.g. "Setup · 1 minute")
 * @param title - Main heading
 * @param lead - Supporting paragraph text
 * @param rows - Ordered list of menu rows rendered by SetupMenuList
 * @param footerHint - Footer text; defaults to the standard dismiss hint if omitted
 */
export function SetupWizardLayout({ eyebrow, title, lead, rows, footerHint }: SetupWizardLayoutProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6 overflow-y-auto">
      <div className="max-w-xl w-full space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {lead}
          </p>
        </div>

        <SetupMenuList rows={rows} />

        <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
          {footerHint ?? 'Skip for now — re-open via the Help (?)'}
        </p>
      </div>
    </div>
  );
}
