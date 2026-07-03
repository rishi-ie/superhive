import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <ScrollArea className="flex-1">{children}</ScrollArea>
    </main>
  );
}
