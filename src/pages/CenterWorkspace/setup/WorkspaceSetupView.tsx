/**
 * WorkspaceSetupView — shown in the center panel when there are zero workspaces.
 * Thin view that wires action handlers to the initial setup row config and the shared layout.
 * Renders in place of HomeView when conditions match.
 */
import { useState } from 'react';
import { useToast } from '@/toasts/context';
import { createWorkspace } from '@/data/workspace/store';
import { spawnAgentStub } from '@/lib/agent-manager';
import { SetupWizardLayout } from './SetupWizardLayout';
import { buildInitialSetupRows } from './rows/initialSetupRows';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  const handleOpenDialog = () => {
    setWorkspaceName('');
    setDialogOpen(true);
  };

  const handleCreateWorkspace = () => {
    const name = workspaceName.trim();
    if (!name) {
      toast({ title: 'Workspace name required', type: 'info' });
      return;
    }
    const ws = createWorkspace({ name });
    if (!ws) return;
    spawnAgentStub({ kind: 'workspace', entityId: ws.id, name: 'Workspace Agent' });
    toast({ title: 'Workspace created', description: ws.name });
    setDialogOpen(false);
    onWorkspaceCreated(ws.id);
  };

  const stubSoon = (label: string) => () =>
    toast({ title: 'Coming soon', description: `${label} — wire later` });

  const rows = buildInitialSetupRows({
    onCreateWorkspace: handleOpenDialog,
    onDismiss,
    onStub: stubSoon,
  });

  return (
    <>
      <SetupWizardLayout
        eyebrow="Setup · 1 minute"
        title="Welcome to Superhive"
        lead="Set up your workspace, hire your first agent, and connect your tools. You can complete everything here, or just the bits you need."
        rows={rows}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name your workspace</DialogTitle>
            <DialogDescription>
              Workspaces isolate agents, projects, and data. You can create more later.
            </DialogDescription>
          </DialogHeader>
          <TextInput
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Corp, Personal, My Team"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateWorkspace();
              if (e.key === 'Escape') setDialogOpen(false);
            }}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleCreateWorkspace} disabled={!workspaceName.trim()}>
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
