import { useParams } from "react-router-dom";
import { SETTINGS_SECTIONS } from "./sections";
import { ModelsSection } from "./sections/ModelsSection";

export function SettingsSectionView() {
  const { section } = useParams();
  const def = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {def?.label ?? "Settings"}
          </h1>
          {section === "models" && (
            <p className="text-sm text-muted-foreground">
              Add your own provider keys and choose which models to enable.
            </p>
          )}
        </header>

        {section === "models" ? (
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
