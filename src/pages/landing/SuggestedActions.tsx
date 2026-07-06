import { Button } from "@/components/ui/button";

export function SuggestedActions() {
  return (
    <div className="flex w-full items-center justify-start gap-2">
      <Button className="h-9 rounded-full border-border bg-transparent px-4 text-xs font-medium text-foreground hover:bg-accent hover:text-foreground">
        Plan New Idea
        <span className="ml-2 text-muted-foreground">⇧Tab</span>
      </Button>
      <Button className="h-9 rounded-full border-border bg-transparent px-4 text-xs font-medium text-foreground hover:bg-accent hover:text-foreground">
        Multitask
      </Button>
    </div>
  );
}
