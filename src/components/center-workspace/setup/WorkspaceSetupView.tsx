/**
 * WorkspaceSetupView — shown in the center panel when there are zero workspaces.
 * Thin view that wires action handlers to the initial setup row config and the shared layout.
 * Renders in place of HomeView when conditions match.
 */
import { useToast } from '@/lib/toast-context';
import { createWorkspace } from '@/data/workspaces/store';
import { SetupWizardLayout } from './SetupWizardLayout';
import { buildInitialSetupRows } from './rows/initialSetupRows';

type WorkspaceSetupViewProps = {
  onWorkspaceCreated: (id: string) => void;
  onDismiss: () => void;
};

/**
 * First-run wizard — shown when no workspaces exist at all.
 * Renders in the center panel as a centered hero block.
 * @param onWorkspaceCreated - Called with the new workspace id after creation
 * @param onDismiss - Called when the user dismisses via "Skip for now"
 */
export function WorkspaceSetupView({ onWorkspaceCreated, onDismiss }: WorkspaceSetupViewProps) {
  const toast = useToast();

  const handleCreateWorkspace = () => {
    const name = window.prompt('Name your workspace');
    if (!name || !name.trim()) {
      toast({ title: 'Workspace name required', type: 'info' });
      return;
    }
    const ws = createWorkspace({ name: name.trim() });
    toast({ title: 'Workspace created', description: ws.name });
    onWorkspaceCreated(ws.id);
  };

  const stubSoon = (label: string) => () =>
    toast({ title: 'Coming soon', description: `${label} — wire later` });

  const rows = buildInitialSetupRows({
    onCreateWorkspace: handleCreateWorkspace,
    onDismiss,
    onStub: stubSoon,
  });

  return (
    <SetupWizardLayout
      eyebrow="Setup · 1 minute"
      title="Welcome to Superhive"
      lead="Set up your workspace, hire your first agent, and connect your tools. You can complete everything here, or just the bits you need."
      rows={rows}
    />
  );
}
