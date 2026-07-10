import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { GearIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function SettingsLink() {
  return (
    <NavLink
      to="/settings"
      className={({ isActive }) =>
        cn(
          "flex h-9 w-full items-center gap-2 px-3 text-xs transition-colors",
          "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
        )
      }
    >
      <Icon icon={GearIcon} className="size-4" />
      <span>Settings</span>
    </NavLink>
  );
}
