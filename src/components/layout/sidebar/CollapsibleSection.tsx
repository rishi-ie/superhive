import * as React from "react";
import { ChevronDown, Home } from "lucide-react";

interface CollapsibleSectionProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  trigger,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <Home className="size-4" />
          <span>{trigger}</span>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="flex flex-col pl-4">{children}</div>}
    </div>
  );
}
