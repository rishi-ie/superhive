import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SidebarQuickActions() {
  return (
    <div className="flex flex-col gap-1 px-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full justify-start gap-2 px-2 text-xs"
        onClick={() => toast.info("New Chat (mock)")}
      >
        <Plus className="size-3.5" />
        New Chat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full justify-start gap-2 px-2 text-xs"
        onClick={() => toast.info("New Project (mock)")}
      >
        <Plus className="size-3.5" />
        New Project
      </Button>
    </div>
  );
}
