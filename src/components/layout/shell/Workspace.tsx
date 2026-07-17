import type { ReactNode } from "react";
import { PreparingToast } from "@/components/common/PreparingToast";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-background">
      {children}
      <PreparingToast />
    </main>
  );
}
