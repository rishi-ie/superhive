import { Outlet } from "react-router-dom";
import { SettingsSidebar } from "./SettingsSidebar";
import { CommandPalette } from "@/components/layout/command-palette";

export function SettingsLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <div className="drag absolute left-0 right-0 top-0 z-[70] h-2.5 w-full" />
      <SettingsSidebar />
      <main className="flex h-full w-full flex-col overflow-hidden bg-background">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}
