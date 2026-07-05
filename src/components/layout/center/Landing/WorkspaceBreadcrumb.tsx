import { ChevronRight, ChevronDown, Home, Laptop } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceBreadcrumb() {
  return (
    <div className="flex w-full items-center gap-1 text-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="size-3" />
            <span>Home</span>
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-border bg-card">
          <DropdownMenuItem>Home</DropdownMenuItem>
          <DropdownMenuItem>Recent</DropdownMenuItem>
          <DropdownMenuItem>Favorites</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChevronRight className="size-3 text-muted-foreground" />
      <Laptop className="size-3 text-muted-foreground" />
      <span className="text-foreground/80">Local</span>
    </div>
  );
}
