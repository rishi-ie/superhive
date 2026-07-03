import type { ReactNode } from "react";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <main className="flex h-full w-full flex-col overflow-hidden bg-background">
      {children}
    </main>
  );
}
