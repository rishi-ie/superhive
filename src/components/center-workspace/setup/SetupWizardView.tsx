/**
 * SetupWizardView — wizard facade. Given the active tab and wizard state,
 * picks which wizard view to render (currently only the initial setup wizard is active).
 *
 * DORMANT WIZARD: WorkspaceReadyView is preserved in code but not rendered.
 * To activate it:
 *   1. Uncomment the WorkspaceReadyView import below
 *   2. Uncomment the showReady useMemo block
 *   3. Change `return null` → `return <WorkspaceReadyView workspaceName={...} onDismiss={onDismissReady} onOpenSettings={onOpenSettings} />`
 */
import { listWorkspaces } from '@/data/workspaces/store';
import { WorkspaceSetupView } from './WorkspaceSetupView';
// import { WorkspaceReadyView } from './WorkspaceReadyView';
import type { CenterTab } from '@/data/tabs/interface';

type SetupWizardViewProps = {
  tab: CenterTab;
  setupDismissed: boolean;
  readyDismissed: boolean;
  onWorkspaceCreated: (id: string) => void;
  onDismissSetup: () => void;
  onDismissReady: () => void;
  onOpenSettings: () => void;
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

  // DORMANT: uncomment when activating WorkspaceReadyView
  // const hasNoProjects = listProjects({ status: 'ACTIVE' }).filter(p => p.workspaceId === tab.workspaceId).length === 0;
  // const hasNoAgents = listProjectAgents(tab.workspaceId).length === 0;
  // const isReadyActive = hasNoProjects && hasNoAgents && !readyDismissed;
  // if (isReadyActive) {
  //   const workspaceName = workspaces.find(w => w.id === tab.workspaceId)?.name ?? tab.workspaceId;
  //   return (
  //     <WorkspaceReadyView
  //       workspaceName={workspaceName}
  //       onDismiss={onDismissReady}
  //       onOpenSettings={onOpenSettings}
  //     />
  //   );
  // }

  void tab;
  void readyDismissed;
  void onDismissReady;
  void onOpenSettings;

  return null;
}
