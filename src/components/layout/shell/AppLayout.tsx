import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "../left-sidebar/AppSidebar";
import { RightSidebar } from "../right-sidebar/RightSidebar";
import { cn } from "@/lib/utils";
import { Workspace } from "./Workspace";
import { CenterBreadcrumb } from "@/components/layout/common/CenterBreadcrumb";
import { TopRightControls } from "@/components/layout/common/TopRightControls";
import { CommandPalette } from "../command-palette/CommandPalette";
import { CreateAgentDialog } from "@/pages/agent-chat/dialogs/CreateAgentDialog";
import { CreateProjectDialog } from "@/pages/project-chat/dialogs/CreateProjectDialog";
import { useProjectReconcileToast } from "@/flows/projects/runtime";

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 280;
const MIN_RIGHT_WIDTH = 200;
const MAX_RIGHT_WIDTH = 480;
const DEFAULT_RIGHT_WIDTH = 370;

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutShell />
    </SidebarProvider>
  );
}

function AppLayoutShell() {
  // Mounts a single subscription for `projects:folder-missing`. Shows a
  // toast per project the fs-watcher hard-deleted because its folder
  // vanished (Finder delete, move, unmounted drive).
  useProjectReconcileToast();
  const { open: leftSidebarOpen } = useSidebar();
  const location = useLocation();
  const [leftSidebarWidth, setLeftSidebarWidth] = React.useState(DEFAULT_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = React.useState(DEFAULT_RIGHT_WIDTH);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(location.pathname === "/");
  const leftContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setRightSidebarOpen(location.pathname !== "/" && location.pathname !== "/plugins");
  }, [location.pathname]);

  const startResizingLeft = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const stopResizingLeft = React.useCallback(() => {
    setIsResizingLeft(false);
  }, []);

  const startResizingRight = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const stopResizingRight = React.useCallback(() => {
    setIsResizingRight(false);
  }, []);

  const resizeLeft = React.useCallback(
    (e: MouseEvent) => {
      if (isResizingLeft) {
        let newWidth = e.clientX;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        setLeftSidebarWidth(newWidth);
      }
    },
    [isResizingLeft]
  );

  const resizeRight = React.useCallback(
    (e: MouseEvent) => {
      if (isResizingRight) {
        let newWidth = window.innerWidth - e.clientX;
        if (newWidth < MIN_RIGHT_WIDTH) newWidth = MIN_RIGHT_WIDTH;
        if (newWidth > MAX_RIGHT_WIDTH) newWidth = MAX_RIGHT_WIDTH;
        setRightSidebarWidth(newWidth);
      }
    },
    [isResizingRight]
  );

  React.useEffect(() => {
    if (isResizingLeft) {
      window.addEventListener("mousemove", resizeLeft);
      window.addEventListener("mouseup", stopResizingLeft);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", resizeLeft);
      window.removeEventListener("mouseup", stopResizingLeft);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, resizeLeft, stopResizingLeft]);

  React.useEffect(() => {
    if (isResizingRight) {
      window.addEventListener("mousemove", resizeRight);
      window.addEventListener("mouseup", stopResizingRight);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", resizeRight);
      window.removeEventListener("mouseup", stopResizingRight);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingRight, resizeRight, stopResizingRight]);

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <div className="drag absolute left-0 right-0 top-0 z-[70] h-2.5 w-full" />

        {leftSidebarOpen && (
          <div
            ref={leftContainerRef}
            className="relative flex h-full flex-shrink-0"
            style={{ width: `${leftSidebarWidth}px` }}
          >
            <AppSidebar width={leftSidebarWidth} />
            <div
              onMouseDown={startResizingLeft}
              className="no-drag absolute right-0 top-0 z-[60] h-full w-1 cursor-col-resize transition-colors hover:bg-foreground/10 active:bg-foreground/20"
            />
          </div>
        )}

        <Workspace>
          <CenterBreadcrumb />
          <TopRightControls
            rightSidebarOpen={rightSidebarOpen}
            onToggleRightSidebar={() => setRightSidebarOpen(o => !o)}
          />
          <Outlet />
        </Workspace>
        <div
          className={cn(
            "relative h-full flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out",
            rightSidebarOpen ? "pointer-events-auto" : "pointer-events-none w-0"
          )}
          style={{ width: rightSidebarOpen ? `${rightSidebarWidth}px` : 0 }}
        >
          <div
            className="relative flex h-full"
            style={{ width: `${rightSidebarWidth}px`, flexShrink: 0 }}
          >
            <div
              onMouseDown={startResizingRight}
              className="no-drag absolute left-0 top-0 z-[60] h-full w-1 cursor-col-resize transition-colors hover:bg-foreground/10 active:bg-foreground/20"
            />
            <RightSidebar width={rightSidebarWidth} />
          </div>
        </div>
      </div>
      <CommandPalette />
      <CreateAgentDialog />
      <CreateProjectDialog />
    </>
  );
}
