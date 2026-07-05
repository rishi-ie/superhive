import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETTINGS_SECTIONS } from "./sections";
import { goBackHome } from "@/flows/go-back-home";

export function SettingsSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-3 pt-9 pb-3">
        <button
          onClick={() => goBackHome(navigate)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>Back to Home</span>
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {SETTINGS_SECTIONS.map((section) => (
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
            <section.icon className="size-4" />
            <span>{section.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
