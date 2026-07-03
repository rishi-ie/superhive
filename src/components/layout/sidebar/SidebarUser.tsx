import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function SidebarUser() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
      <Avatar className="size-8">
        <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
          U
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">User</span>
        <span className="text-xs text-muted-foreground">Free</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
