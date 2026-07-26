import { Icon } from "@/components/ui/icon";
import { GearIcon } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { LayoutAlignLeftIcon, LayoutAlignRightIcon, ListTreeIcon } from "@hugeicons/core-free-icons";
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
  rightSidebarWidth: number;
  isRightSidebarResizing: boolean;
  statusBarOpen: boolean;
  onToggleStatusBar: () => void;
}

export function TopRightControls({
  rightSidebarOpen,
  rightSidebarWidth,
  isRightSidebarResizing,
  statusBarOpen,
  onToggleStatusBar,
}: TopRightControlsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isPlugins = location.pathname === "/plugins";

  return (
    <div
      className={`absolute top-2 z-[60] flex items-center gap-gap-tight pr-3 text-muted-foreground ${
        isRightSidebarResizing
          ? "transition-none"
          : "transition-[right] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      }`}
      style={{ right: rightSidebarOpen ? rightSidebarWidth : 32 }}
    >
      {isLanding && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-icon border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
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
              className="rounded-icon border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default"
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
            className="cursor-default rounded-icon border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-[#1D1D1D] aria-expanded:text-[#FCFCFC]"
            onClick={onToggleStatusBar}
            aria-label={`${statusBarOpen ? "Close" : "Open"} status panel`}
            aria-expanded={statusBarOpen}
          >
            <HugeIcon icon={ListTreeIcon} size={16} className="size-4 text-current" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{statusBarOpen ? "Close" : "Open"} status panel</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface RightSidebarToggleProps {
  open: boolean;
  onToggle: () => void;
}

export function RightSidebarToggle({ open, onToggle }: RightSidebarToggleProps) {
  return (
    <div className="absolute right-3 top-2 z-[80] text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="cursor-default rounded-icon border-none text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-[#1D1D1D] aria-expanded:text-[#FCFCFC]"
            onClick={onToggle}
            aria-label={`${open ? "Close" : "Open"} control panel`}
            aria-expanded={open}
          >
            <span className="relative size-4" aria-hidden="true">
              <HugeIcon
                icon={LayoutAlignLeftIcon}
                size={16}
                className={`absolute inset-0 size-4 text-current transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
                  open ? "rotate-0 opacity-100" : "-rotate-45 opacity-0"
                }`}
              />
              <HugeIcon
                icon={LayoutAlignRightIcon}
                size={16}
                className={`absolute inset-0 size-4 text-current transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
                  open ? "rotate-45 opacity-0" : "rotate-0 opacity-100"
                }`}
              />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{open ? "Close" : "Open"} control panel</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
