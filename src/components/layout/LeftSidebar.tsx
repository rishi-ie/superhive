import { ScrollArea } from "@/components/ui/scroll-area";

export function LeftSidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <ScrollArea className="flex-1">
        <div className="p-4">
          <h2 className="mb-4 px-2 text-lg font-semibold text-sidebar-foreground">
            Navigation
          </h2>
          {/* TODO: Add navigation items */}
        </div>
      </ScrollArea>
    </aside>
  );
}
