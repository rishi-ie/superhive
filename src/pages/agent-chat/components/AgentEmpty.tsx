import { Icon } from "@/components/ui/icon";
import { UserIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';

export function AgentEmpty() {
  const { setOpen } = useOpenCreateAgent();
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-gap-loose px-6 text-center">
        <div className="rounded-full bg-muted/40 p-card">
          <Icon icon={UserIcon} className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium text-foreground">No agent selected</h2>
        <p className="text-sm text-muted-foreground">
          Pick an agent from the sidebar, or create a new one to begin.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} className="mt-1 gap-gap-tight.5">
          <Icon icon={PlusIcon} className="size-4" />
          New Agent
        </Button>
      </div>
    </div>
  );
}