/**
 * WorkspaceAgentView — stub pending project-agent terminal work.
 */
type WorkspaceAgentViewProps = {
  workspaceId: string;
  onSend?: (message: string) => void;
};

export function WorkspaceAgentView({ workspaceId }: WorkspaceAgentViewProps) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      {workspaceId ? `Workspace agent terminal coming soon` : 'Select a workspace first'}
    </div>
  );
}
