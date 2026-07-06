import { HugeiconsIcon } from "@/components/ui/icon";
import { ArrowRight01Icon, ArrowDown01Icon, Home01Icon, LaptopIcon } from "@hugeicons/core-free-icons";
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
            <HugeiconsIcon icon={Home01Icon} className="size-3" />
            <span>Home</span>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-border bg-card">
          <DropdownMenuItem>Home</DropdownMenuItem>
          <DropdownMenuItem>Recent</DropdownMenuItem>
          <DropdownMenuItem>Favorites</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 text-muted-foreground" />
      <HugeiconsIcon icon={LaptopIcon} className="size-3 text-muted-foreground" />
      <span className="text-foreground/80">Local</span>
    </div>
  );
}
