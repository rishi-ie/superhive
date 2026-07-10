import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon, Robot02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';

export function EmptyAgentsState() {
  const { setOpen } = useOpenCreateAgent();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={Robot02Icon} className="size-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">No agents yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first digital employee to get started.
        </p>
      </div>

      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
        New agent
      </Button>
    </div>
  );
}