/**
 * Empty-state onboarding wizard with action cards.
 */
import { STROKE_WIDTH } from '@/lib/constants';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type WizardAction = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  recommended?: boolean;
};

export type WizardConfig = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions: WizardAction[];
  skipLabel?: string;
};

export type OnboardingWizardProps = {
  config: WizardConfig;
  onAction?: (actionId: string) => void;
};

/**
 * @param config - Wizard configuration (icon, title, actions)
 * @param onAction - Called when an action or skip is clicked
 */
export function OnboardingWizard({ config, onAction }: OnboardingWizardProps) {
  const { icon: Icon, title, subtitle, actions, skipLabel } = config;

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
      <div className="flex flex-col items-center gap-8 w-full max-w-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-sidebar-accent/50">
            <Icon size={28} className="text-chart-1" strokeWidth={STROKE_WIDTH} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onAction?.(action.id)}
                className={`flex flex-col gap-2 p-4 rounded-md border text-left transition-colors hover:bg-sidebar-accent/30 ${
                  action.recommended
                    ? 'border-chart-1/50 bg-chart-1/5 hover:border-chart-1'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center size-8 rounded-md bg-secondary">
                    <ActionIcon size={16} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
                  </div>
                  {action.recommended && (
                    <Badge variant="recommended">REC</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {skipLabel && (
          <Button
            variant="ghost"
            onClick={() => onAction?.('skip')}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            {skipLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
