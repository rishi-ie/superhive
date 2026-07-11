import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface ChecklistRowProps {
  text: string;
  done: boolean;
}

export function ChecklistRow({ text, done }: ChecklistRowProps) {
  return (
    <div className="flex items-center gap-list-item py-0.5">
      <Checkbox
        checked={done}
        disabled
        className="size-3.5"
      />
      <span
        className={cn(
          "text-sm",
          done ? "text-muted-foreground/60" : "text-foreground"
        )}
      >
        {text}
      </span>
    </div>
  );
}
