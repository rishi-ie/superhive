import { cn } from "@/lib/utils";

interface ChecklistRowProps {
  text: string;
  done: boolean;
}

export function ChecklistRow({ text, done }: ChecklistRowProps) {
  return (
    <div className="flex items-start gap-list-item py-0.5">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-block font-mono text-xs leading-none",
          done ? "text-muted-foreground/60" : "text-muted-foreground"
        )}
      >
        {done ? "\u25A0" : "\u25A1"}
      </span>
      <span
        className={cn(
          "text-xs",
          done ? "text-muted-foreground/60 line-through" : "text-foreground"
        )}
      >
        {text}
      </span>
    </div>
  );
}
