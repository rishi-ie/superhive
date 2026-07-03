import { ExternalLink, MoreHorizontal, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopRightControls() {
  return (
    <div className="absolute right-4 top-3 flex items-center gap-1.5 text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ExternalLink className="size-3.5" />
        <span>Editor Window</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-border bg-card">
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Help</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <AppWindow className="size-4" />
      </Button>
    </div>
  );
}
