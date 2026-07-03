import { Plus, Mic, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ComposerCard() {
  return (
    <Card className="w-full max-w-[620px] rounded-2xl border border-border bg-card p-1.5 shadow-foreground/10">
      <Textarea
        placeholder="Plan, Build, / for skills, @ for context"
        className="min-h-[90px] resize-none border-0 bg-transparent px-3 py-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="flex items-center gap-2 px-1 pb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full bg-[#2a2a2a] text-muted-foreground hover:bg-[#333333] hover:text-foreground"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Add attachment</span>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Lock className="size-3" />
              <span>Composer 2.5 Fast</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="border-border bg-card">
            <DropdownMenuItem>Composer 2.5 Pro</DropdownMenuItem>
            <DropdownMenuItem>Composer 2.5 Fast</DropdownMenuItem>
            <DropdownMenuItem>Composer 1.5</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full bg-white text-black hover:bg-white/90"
            >
              <Mic className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Voice input</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}
