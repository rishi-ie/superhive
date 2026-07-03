import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function SidebarUser() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.05]">
      <Avatar className="size-8">
        <AvatarFallback className="bg-white/[0.08] text-xs font-medium text-foreground/90">
          U
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-foreground/90">User</span>
        <span className="text-xs text-muted-foreground">Free</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground/80"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
