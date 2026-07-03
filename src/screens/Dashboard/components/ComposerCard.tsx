import { Plus, Mic, Lock, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ComposerCard() {
  return (
    <Card className="w-full max-w-[620px] rounded-2xl border border-white/[0.06] bg-card p-2 shadow-2xl shadow-black/30">
      <Textarea
        placeholder="Plan, Build, / for skills, @ for context"
        className="min-h-[120px] resize-none border-0 bg-transparent px-4 py-4 text-sm leading-relaxed text-foreground/90 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-white/[0.05] hover:text-foreground/80"
        >
          <Plus className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-foreground/90 hover:bg-white/[0.05]"
            >
              <span>Composer 2.5 Fast</span>
              <Lock className="size-3" />
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="border-white/[0.06] bg-card">
            <DropdownMenuItem>Composer 2.5 Pro</DropdownMenuItem>
            <DropdownMenuItem>Composer 2.5 Fast</DropdownMenuItem>
            <DropdownMenuItem>Composer 1.5</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-white/[0.05] hover:text-foreground/80"
        >
          <Mic className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
