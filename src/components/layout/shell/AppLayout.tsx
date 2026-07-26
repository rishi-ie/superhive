import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "../left-sidebar/AppSidebar";
import { RightSidebar } from "../right-sidebar/RightSidebar";
import { RightStatusBar } from "../right-sidebar/RightStatusBar";
import { cn } from "@/lib/utils";
import { Workspace } from "./Workspace";
import { CenterBreadcrumb } from "@/components/layout/common/CenterBreadcrumb";
import { RightSidebarToggle, TopRightControls } from "@/components/layout/common/TopRightControls";
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
const STATUS_PANEL_WIDTH = 304;

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
  const [statusBarOpen, setStatusBarOpen] = React.useState(false);
  const leftContainerRef = React.useRef<HTMLDivElement>(null);
  const rightResizeRef = React.useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  React.useEffect(() => {
    const shouldOpen = location.pathname !== "/" && location.pathname !== "/plugins";
    setRightSidebarOpen(shouldOpen);
    setStatusBarOpen(false);
  }, [location.pathname]);

  const startResizingLeft = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const stopResizingLeft = React.useCallback(() => {
    setIsResizingLeft(false);
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

  const startResizingRight = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    rightResizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: rightSidebarWidth,
    };
    setIsResizingRight(true);
  }, [rightSidebarWidth]);

  const resizeRight = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const resize = rightResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    setRightSidebarWidth(Math.min(MAX_RIGHT_WIDTH, Math.max(MIN_RIGHT_WIDTH, resize.startWidth + resize.startX - event.clientX)));
  }, []);

  const stopResizingRight = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (rightResizeRef.current?.pointerId !== event.pointerId) return;
    rightResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsResizingRight(false);
  }, []);

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
    if (!isResizingRight) return;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingRight]);

  const toggleRightSidebar = React.useCallback(() => {
    if (!rightSidebarOpen) setStatusBarOpen(false);
    setRightSidebarOpen((open) => !open);
  }, [rightSidebarOpen]);

  const toggleStatusBar = React.useCallback(() => {
    setStatusBarOpen((open) => !open);
  }, []);

  return (
    <>
      <div className="relative flex h-screen w-screen overflow-hidden">
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
          <Outlet />
        </Workspace>
        <div
          className={cn(
            "relative h-full flex-shrink-0 overflow-hidden motion-reduce:transition-none",
            isResizingRight
              ? "transition-none"
              : "transition-[width] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            rightSidebarOpen ? "pointer-events-auto" : "pointer-events-none w-0"
          )}
          style={{ width: rightSidebarOpen ? `${rightSidebarWidth}px` : 0 }}
        >
          <div
            className={cn(
              "relative flex h-full min-w-0 w-full motion-reduce:transition-none",
              isResizingRight
                ? "transition-none"
                : "will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              rightSidebarOpen ? "translate-x-0 opacity-100 delay-50" : "translate-x-2 opacity-0"
            )}
          >
            <div
              onPointerCancel={stopResizingRight}
              onPointerDown={startResizingRight}
              onLostPointerCapture={stopResizingRight}
              onPointerMove={resizeRight}
              onPointerUp={stopResizingRight}
              className="no-drag absolute left-0 top-0 z-[60] h-full w-1 touch-none cursor-col-resize transition-colors hover:bg-foreground/10 active:bg-foreground/20"
            />
            <RightSidebar width={rightSidebarWidth} />
          </div>
        </div>
        <div
          className={cn(
            "relative h-full flex-shrink-0 bg-[#111111] overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            statusBarOpen && !rightSidebarOpen ? "pointer-events-auto" : "pointer-events-none w-0"
          )}
          style={{ width: statusBarOpen && !rightSidebarOpen ? `${STATUS_PANEL_WIDTH}px` : 0 }}
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-12 border-t border-border" />
        </div>
        <RightStatusBar
          open={statusBarOpen}
          rightOffset={rightSidebarOpen ? rightSidebarWidth : 0}
          isPopover={rightSidebarOpen}
          onDismiss={() => setStatusBarOpen(false)}
        />
        <TopRightControls
          rightSidebarOpen={rightSidebarOpen}
          rightSidebarWidth={rightSidebarWidth}
          isRightSidebarResizing={isResizingRight}
          statusBarOpen={statusBarOpen}
          onToggleStatusBar={toggleStatusBar}
        />
        <RightSidebarToggle open={rightSidebarOpen} onToggle={toggleRightSidebar} />
      </div>
      <CommandPalette />
      <CreateAgentDialog />
      <CreateProjectDialog />
    </>
  );
}
