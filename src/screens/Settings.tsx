import { useState } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { AccountSettings } from "@/components/settings/AccountSettings";

type SettingsProps = {
  onBack: () => void;
};

export function Settings({ onBack }: SettingsProps) {
  const [activeSection, setActiveSection] = useState("account");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <div className="w-75 shrink-0">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBack={onBack}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-12 pt-16 pb-24">
          {activeSection === "account" && (
            <AccountSettings
              name="Your Name"
              email="you@example.com"
            />
          )}
          {activeSection !== "account" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold capitalize text-foreground">
                {activeSection.replace("-", " & ")}
              </h2>
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
