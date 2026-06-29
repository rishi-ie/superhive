/**
 * WorkspaceReadyView — shown in the center panel for a workspace with no projects or agents.
 * Thin view that wires action handlers to the empty-workspace row config and the shared layout.
 * Renders in place of HomeView when conditions match.
 *
 * DORMANT — currently inactive. Activate by:
 *   1. Uncomment the WorkspaceReadyView import in SetupWizardView.tsx
 *   2. Uncomment the showReady useMemo block in SetupWizardView.tsx
 *   3. Change `return null` → `return <WorkspaceReadyView ... />`
 */
import { useToast } from '@/lib/toast-context';
import { SetupWizardLayout } from './SetupWizardLayout';
import { buildEmptyWorkspaceRows } from './rows/emptyWorkspaceRows';

type WorkspaceReadyViewProps = {
  workspaceName: string;
  onDismiss: () => void;
  onOpenSettings: () => void;
};

/**
 * Per-workspace onboarding wizard — shown when a workspace has no projects and no agents.
 * Renders in the center panel as a centered hero block.
 * @param workspaceName - Name of the current workspace shown in the eyebrow
 * @param onDismiss - Called when the user dismisses via "Skip for now"
 * @param onOpenSettings - Navigates to settings
 */
export function WorkspaceReadyView({ workspaceName, onDismiss, onOpenSettings }: WorkspaceReadyViewProps) {
  const toast = useToast();

  const stubSoon = (label: string) => () =>
    toast({ title: 'Coming soon', description: `${label} — wire later` });

  const rows = buildEmptyWorkspaceRows({
    onDismiss,
    onOpenSettings,
    onStub: stubSoon,
  });

  return (
    <SetupWizardLayout
      eyebrow={`Setup · ${workspaceName}`}
      title="Set up your workspace"
      lead="Spin up a project, hire an agent, and start assigning work. Everything here is optional."
      rows={rows}
    />
  );
}
