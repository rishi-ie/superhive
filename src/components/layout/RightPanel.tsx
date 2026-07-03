import { ScrollArea } from "@/components/ui/scroll-area";

export function RightPanel() {
  return (
    <aside className="flex h-full w-64 flex-col border-l border-border bg-sidebar">
      <ScrollArea className="flex-1">
        <div className="p-4">
          <h2 className="mb-4 px-2 text-lg font-semibold text-sidebar-foreground">
            Details
          </h2>
          {/* TODO: Add detail panel content */}
        </div>
      </ScrollArea>
    </aside>
  );
}
