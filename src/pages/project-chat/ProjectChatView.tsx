import { useParams } from "react-router-dom";

export function ProjectChatView() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">
        {projectId ? `Project Chat · ${projectId}` : "Project Chat"}
      </span>
    </div>
  );
}
