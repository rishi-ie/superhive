import { Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuggestedActions() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        className="h-9 rounded-full border-border bg-transparent px-4 text-xs font-medium text-foreground hover:bg-accent hover:text-foreground"
      >
        <Sparkles className="size-3.5" />
        Plan New Idea
      </Button>
      <Button
        variant="outline"
        className="h-9 rounded-full border-border bg-transparent px-4 text-xs font-medium text-foreground hover:bg-accent hover:text-foreground"
      >
        <Layers className="size-3.5" />
        Multitask
      </Button>
    </div>
  );
}
