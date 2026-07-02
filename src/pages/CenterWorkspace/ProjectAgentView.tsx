/**
 * ProjectAgentView — stub pending project-agent terminal work.
 */
type ProjectAgentViewProps = {
  projectId: string;
  workspaceId: string;
  onSend?: (message: string) => void;
};

export function ProjectAgentView({ projectId }: ProjectAgentViewProps) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      {projectId ? `Project agent terminal coming soon` : 'Open a project first'}
    </div>
  );
}
