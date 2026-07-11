import { Icon } from "@/components/ui/icon";
import { PlusIcon, RobotIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';

export function EmptyAgentsState() {
  const { setOpen } = useOpenCreateAgent();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon icon={RobotIcon} className="size-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-gap-tight">
        <h2 className="text-base font-medium text-foreground">No agents yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first digital employee to get started.
        </p>
      </div>

      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-list-item"
      >
        <Icon icon={PlusIcon} className="size-3.5" />
        New agent
      </Button>
    </div>
  );
}