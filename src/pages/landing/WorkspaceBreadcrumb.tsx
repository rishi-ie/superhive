import { Icon } from "@/components/ui/icon";
import { CaretRightIcon, CaretDownIcon, HouseIcon, LaptopIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceBreadcrumb() {
  return (
    <div className="flex w-full items-center gap-gap-tight text-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-gap-tight text-muted-foreground hover:text-foreground"
          >
            <Icon icon={HouseIcon} className="size-3" />
            <span>Home</span>
            <Icon icon={CaretDownIcon} className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-border bg-modal text-modal-foreground">
          <DropdownMenuItem className="text-modal-foreground">Home</DropdownMenuItem>
          <DropdownMenuItem className="text-modal-foreground">Recent</DropdownMenuItem>
          <DropdownMenuItem className="text-modal-foreground">Favorites</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Icon icon={CaretRightIcon} className="size-3 text-muted-foreground" />
      <Icon icon={LaptopIcon} className="size-3 text-muted-foreground" />
      <span className="text-foreground/80">Local</span>
    </div>
  );
}
