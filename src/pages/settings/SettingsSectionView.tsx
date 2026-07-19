import { useParams } from "react-router-dom";
import { SETTINGS_SECTIONS } from "./sections/registry";
import { ModelsSection } from "./sections/ModelsSection";
import { GeneralSection } from "./sections/GeneralSection";

export function SettingsSectionView() {
  const { section } = useParams();
  const def = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-[800px] w-full mx-auto px-10 py-8">
        <header className="flex flex-col gap-gap-tight">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {def?.label ?? "Settings"}
          </h1>
          {section === "models" && (
            <p className="text-sm text-muted-foreground">
              Add your API key for each provider to enable its models in chat.
            </p>
          )}
        </header>

        {section === "general" ? (
          <GeneralSection />
        ) : section === "models" ? (
          <ModelsSection />
        ) : (
          <p className="text-sm text-muted-foreground">
            Section content — coming soon
          </p>
        )}
      </div>
    </div>
  );
}