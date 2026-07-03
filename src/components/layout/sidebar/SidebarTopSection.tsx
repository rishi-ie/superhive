import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarTopSection() {
  return (
    <div className="flex flex-col gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-full justify-start gap-2 bg-muted text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="size-4" />
            <span>New Agent</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Create a new agent</span>
        </TooltipContent>
      </Tooltip>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="h-8 rounded-lg border-transparent bg-muted pl-9 text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
      </div>
    </div>
  );
}
