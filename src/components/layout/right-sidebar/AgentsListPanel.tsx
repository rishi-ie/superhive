import { ScrollArea } from "@/components/ui/scroll-area";

export function AgentsListPanel() {
  return (
    <div className="flex h-full flex-col px-button-x">
      <ScrollArea className="h-full">
        <div className="flex min-h-full items-center justify-center">
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
      </ScrollArea>
    </div>
  );
}
