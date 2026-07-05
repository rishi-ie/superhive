import type { ReactNode } from "react";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
      <main className="relative flex h-full w-full flex-col overflow-hidden bg-[#181818]">
      {children}
    </main>
  );
}
