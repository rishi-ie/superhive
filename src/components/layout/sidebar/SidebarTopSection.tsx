import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SidebarTopSection() {
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="ghost"
        className="h-11 w-full justify-start gap-2 rounded-xl bg-white/[0.03] text-sm font-medium text-foreground/90 hover:bg-white/[0.06]"
      >
        <Plus className="size-4" />
        <span>New Agent</span>
      </Button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search"
          className="h-9 rounded-lg border-transparent bg-white/[0.03] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/10"
        />
      </div>
    </div>
  );
}
