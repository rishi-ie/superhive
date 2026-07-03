import { Outlet } from "react-router-dom";
import { LeftSidebar } from "./LeftSidebar";
import { Workspace } from "./Workspace";
import { RightPanel } from "./RightPanel";

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <LeftSidebar />
      <Workspace>
        <Outlet />
      </Workspace>
      <RightPanel />
    </div>
  );
}
