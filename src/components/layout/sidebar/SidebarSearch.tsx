import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function SidebarSearch() {
  return (
    <div className="px-2">
      <InputGroup className="h-8">
        <InputGroupInput placeholder="Search..." className="h-8 text-xs" />
        <InputGroupAddon align="inline-start">
          <Search className="size-3.5 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <kbd
            className={cn(
              "pointer-events-none rounded border bg-muted px-1.5 py-0.5",
              "text-[10px] font-medium text-muted-foreground",
              "font-sans"
            )}
          >
            ⌘K
          </kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
