import { Icon } from "@/components/ui/icon";
import { GearIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { LayoutAlignLeftIcon, LayoutAlignRightIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { goToSettings } from '@/flows/navigation';

interface TopRightControlsProps {
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export function TopRightControls({
  rightSidebarOpen,
  onToggleRightSidebar,
}: TopRightControlsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isPlugins = location.pathname === "/plugins";

  return (
    <div className="absolute right-0 top-2 flex items-center gap-gap-tight text-muted-foreground pr-3">
      {isLanding && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
              onClick={() => goToSettings(navigate)}
            >
              <Icon icon={GearIcon} className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Settings</span>
          </TooltipContent>
        </Tooltip>
      )}
      {isPlugins && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
              onClick={() => goToSettings(navigate)}
            >
              <Icon icon={GearIcon} className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Settings</span>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
            onClick={onToggleRightSidebar}
          >
            {rightSidebarOpen ? (
              <HugeIcon icon={LayoutAlignLeftIcon} size={16} className="size-4 text-muted-foreground" />
            ) : (
              <HugeIcon icon={LayoutAlignRightIcon} size={16} className="size-4 text-muted-foreground" />
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
