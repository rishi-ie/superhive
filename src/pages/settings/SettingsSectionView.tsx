import { useParams } from "react-router-dom";
import { SETTINGS_SECTIONS } from "./sections/registry";
import { ModelsSection } from "./sections/ModelsSection";
import { GeneralSection } from "./sections/GeneralSection";
import { SettingsPage } from "./SettingsPrimitives";

export function SettingsSectionView() {
  const { section } = useParams();
  const def = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className="settings-scroll flex h-full w-full flex-col overflow-y-auto bg-background">
      <SettingsPage
        title={def?.label ?? "Settings"}
        description={
          section === "models"
            ? "Choose the models available in chat and manage their provider access."
            : undefined
        }
      >

        {section === "general" ? (
          <GeneralSection />
        ) : section === "models" ? (
          <ModelsSection />
        ) : (
          <p className="text-sm text-muted-foreground">
            Section content — coming soon
          </p>
        )}
      </SettingsPage>
    </div>
  );
}
