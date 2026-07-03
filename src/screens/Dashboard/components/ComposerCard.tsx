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
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
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
              <span>Composer 2.5 Fast</span>
              <Lock className="size-3" />
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="border-border bg-card">
            <DropdownMenuItem>Composer 2.5 Pro</DropdownMenuItem>
            <DropdownMenuItem>Composer 2.5 Fast</DropdownMenuItem>
            <DropdownMenuItem>Composer 1.5</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
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
