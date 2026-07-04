import { PanelRight, PanelRightClose, MoreHorizontal, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopRightControlsProps {
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export function TopRightControls({
  rightSidebarOpen,
  onToggleRightSidebar,
}: TopRightControlsProps) {
  return (
    <div className="absolute right-3 top-3 flex items-center gap-1 text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 gap-1.5 rounded-md px-2 text-xs hover:bg-accent ${
              rightSidebarOpen
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={onToggleRightSidebar}
          >
            {rightSidebarOpen ? (
              <PanelRightClose className="size-3.5" />
            ) : (
              <PanelRight className="size-3.5" />
            )}
            <span>Control panel</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{rightSidebarOpen ? "Close" : "Open"} control panel</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>
          <span>More options</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Bell className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Notifications</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
