import * as React from "react";
import { ChevronRight } from "lucide-react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarSection({
  title,
  icon,
  defaultOpen = false,
  trailing,
  children,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <CollapsiblePrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <CollapsiblePrimitive.Trigger asChild>
        <button
          type="button"
          className="flex h-7 w-full items-center justify-between gap-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <div className="flex items-center gap-1.5">
            <ChevronRight
              className={cn(
                "size-3 flex-shrink-0 transition-transform duration-100",
                isOpen && "rotate-90"
              )}
            />
            {icon && (
              <span className="flex size-3 items-center justify-center">
                {icon}
              </span>
            )}
            <span>{title}</span>
          </div>
          {trailing && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {trailing}
            </div>
          )}
        </button>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="flex flex-col data-[state=open]:animate-in data-[state=open]:fade-in-0">
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
