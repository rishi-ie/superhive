import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Accordion({
  title,
  badge,
  defaultOpen = false,
  emptyText,
  children,
  className,
}: AccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const hasContent = children !== undefined && children !== null && children !== false;

  return (
    <div className={cn("flex flex-col", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex items-center justify-between gap-gap-loose py-button-y text-left"
      >
        <span className="flex items-center gap-list-item text-sm font-medium text-muted-foreground">
          {title}
          {badge !== undefined && (
            <span className="rounded-button bg-muted px-1.5 py-px text-[10px] tabular-nums text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <CaretDownIcon
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-gap-tight pb-button-y">
          {hasContent ? children : emptyText ? (
            <span className="text-xs text-muted-foreground/60">{emptyText}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
