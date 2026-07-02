/**
 * SetupWizardView — wizard facade. Given the active tab and wizard state,
 * picks which wizard view to render (initial setup OR per-workspace ready).
 */
import { listWorkspaces } from '@/data/workspace/store';
import { listProjects } from '@/data/project/store';
import { listProjectAgents } from '@/data/project/store';
import { WorkspaceSetupView } from './WorkspaceSetupView';
import { WorkspaceReadyView } from './WorkspaceReadyView';
import type { CenterTab } from '@/data/tab/interface';

type SetupWizardViewProps = {
  tab: CenterTab;
  setupDismissed: boolean;
  readyDismissed: boolean;
  onWorkspaceCreated: (id: string) => void;
  onDismissSetup: () => void;
  onDismissReady: () => void;
  onOpenSettings: () => void;
  onCreateProject: () => void;
};

/**
 * Wizard facade — dispatches to the correct wizard view based on app state.
 * Currently only the initial no-workspace setup wizard is active.
 * @param tab - The active tab (provides workspaceId for ready-wizard condition check)
 * @param setupDismissed - Whether the no-workspace setup wizard has been dismissed this session
 * @param readyDismissed - Whether the per-workspace ready wizard has been dismissed for the active workspace
 * @param onWorkspaceCreated - Called after a new workspace is created via the setup wizard
 * @param onDismissSetup - Called when the user dismisses the setup wizard
 * @param onDismissReady - Called when the user dismisses the ready wizard
 * @param onOpenSettings - Called when the user wants to open settings
 */
export function SetupWizardView({
  tab,
  setupDismissed,
  readyDismissed,
  onWorkspaceCreated,
  onDismissSetup,
  onDismissReady,
  onOpenSettings,
  onCreateProject,
}: SetupWizardViewProps) {
  const workspaces = listWorkspaces();
  const isSetupActive = workspaces.length === 0 && !setupDismissed;

  if (isSetupActive) {
    return (
      <WorkspaceSetupView
        onWorkspaceCreated={onWorkspaceCreated}
        onDismiss={onDismissSetup}
      />
    );
  }

  const workspaceProjects = listProjects({ status: 'ACTIVE' }).filter(
    (p) => p.workspaceId === tab.workspaceId,
  );
  const hasNoProjects = workspaceProjects.length === 0;
  const hasNoAgents = listProjectAgents(tab.workspaceId).length === 0;
  const isReadyActive = hasNoProjects && hasNoAgents && !readyDismissed;

  if (isReadyActive) {
    const workspaceName =
      workspaces.find((w) => w.id === tab.workspaceId)?.name ?? tab.workspaceId;
    return (
      <WorkspaceReadyView
        workspaceName={workspaceName}
        onDismiss={onDismissReady}
        onOpenSettings={onOpenSettings}
        onCreateProject={onCreateProject}
      />
    );
  }

  void tab;

  return null;
}
