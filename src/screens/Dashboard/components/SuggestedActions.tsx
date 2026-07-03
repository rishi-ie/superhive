import { Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuggestedActions() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        className="h-9 rounded-full border-white/[0.08] bg-transparent px-4 text-xs font-medium text-foreground/80 hover:bg-white/[0.04] hover:text-foreground"
      >
        <Sparkles className="size-3.5" />
        Plan New Idea
      </Button>
      <Button
        variant="outline"
        className="h-9 rounded-full border-white/[0.08] bg-transparent px-4 text-xs font-medium text-foreground/80 hover:bg-white/[0.04] hover:text-foreground"
      >
        <Layers className="size-3.5" />
        Multitask
      </Button>
    </div>
  );
}
