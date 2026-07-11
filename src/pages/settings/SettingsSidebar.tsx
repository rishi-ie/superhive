import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { CaretLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { SETTINGS_GROUPS } from "./sections/registry";
import { goBackHome } from "@/flows/navigation/go-back-home";

export function SettingsSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-68 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex flex-col gap-1 px-2 pt-12 pb-1">
        <button
          onClick={() => goBackHome(navigate)}
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:!text-[#dedede]"
        >
          <Icon icon={CaretLeftIcon} className="size-4" />
          <span>Back to Home</span>
        </button>
        <button
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:!text-[#dedede]"
        >
          <Icon icon={MagnifyingGlassIcon} className="size-4" />
          <span>Search</span>
        </button>
      </div>
      <nav className="flex flex-col gap-4 px-2 pt-4">
        {SETTINGS_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.sections.map((section) => (
              <NavLink
                key={section.id}
                to={`/settings/${section.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-2 rounded-lg px-2 text-sm transition-colors",
                    "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )
                }
              >
                <section.icon className="size-4 shrink-0" />
                <span className="flex-1">{section.label}</span>
                {section.trailingIcon && (
                  <section.trailingIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
