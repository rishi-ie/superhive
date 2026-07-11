import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { GearSixIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function SettingsLink() {
  return (
    <NavLink
      to="/settings"
      className={({ isActive }) =>
        cn(
          "flex h-control-md w-full items-center gap-stack px-button-x text-xs transition-colors",
          "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
        )
      }
    >
      <Icon icon={GearSixIcon} className="size-4" />
      <span>Settings</span>
    </NavLink>
  );
}
