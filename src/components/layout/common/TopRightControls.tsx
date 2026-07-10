import { Icon } from "@/components/ui/icon";
import { SidebarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
    <div className="absolute right-0 top-2 flex items-center gap-1 text-muted-foreground pr-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
            onClick={onToggleRightSidebar}
          >
            {rightSidebarOpen ? (
              <Icon icon={SidebarIcon} className="size-4" />
            ) : (
              <Icon icon={SidebarIcon} className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{rightSidebarOpen ? "Close" : "Open"} control panel</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
