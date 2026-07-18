/**
 * Forked from `src/pages/agent-chat/components/AgentError`.
 *
 * Project-agent runtimes are intentionally forked from agent runtimes
 * so they can evolve independently. The Delete action cascades to the
 * project and its project-agent instead of just the agent.
 */

import { Icon } from "@/components/ui/icon";
import { WarningIcon, ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '@/flows/projects/crud/delete-project';
import { goHome } from '@/flows/navigation';

interface ProjectAgentErrorProps {
	lastError?: string;
	onRestart: () => void;
	projectId: string;
}

export function ProjectAgentError({ lastError, onRestart, projectId }: ProjectAgentErrorProps) {
	const navigate = useNavigate();

	const onDelete = async () => {
		const result = await deleteProject(projectId);
		if (result.ok) {
			goHome(navigate);
		}
	};

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-4 px-6 text-center">
        <div className="rounded-full bg-destructive/10 p-panel">
          <Icon icon={WarningIcon} className="size-6 text-destructive" />
        </div>
        <div className="flex flex-col gap-gap-tight">
          <h2 className="text-base font-medium text-foreground">Project agent runtime error</h2>
          {lastError && (
            <p className="text-xs font-mono text-muted-foreground break-words max-w-sm">
              {lastError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-stack">
          <Button variant="outline" size="sm" onClick={onRestart} className="gap-list-item">
            <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-list-item text-destructive hover:text-destructive"
          >
            <Icon icon={TrashIcon} className="size-3.5" />
            Delete Project
          </Button>
        </div>
      </div>
    </div>
  );
}