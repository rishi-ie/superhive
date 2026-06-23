import { Communications as CommChannels } from './Communications';
import { OnboardingWizard } from './OnboardingWizard';
import { COMMUNICATIONS_WIZARD_CONFIG } from '@/data/wizard-configs';
import { listChannels, listProjectAgents } from '@/data/projects/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

export function CommunicationsView({ onAction }: { onAction?: OnboardingWizardProps['onAction'] }) {
  const channels = listChannels();
  const agents = listProjectAgents();

  if (channels.length === 0) {
    return (
      <OnboardingWizard
        config={COMMUNICATIONS_WIZARD_CONFIG}
        onAction={onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-background flex-1">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Communications</h1>
        <span className="text-xs text-muted-foreground">{channels.length} channel{channels.length !== 1 ? 's' : ''}</span>
      </div>
      <CommChannels channels={channels} agents={agents} />
    </div>
  );
}
