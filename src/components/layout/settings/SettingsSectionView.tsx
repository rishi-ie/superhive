import { useParams } from "react-router-dom";
import { SETTINGS_SECTIONS } from "./sections";

export function SettingsSectionView() {
  const { section } = useParams();
  const def = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className="flex h-full w-full flex-col bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {def?.label ?? "Settings"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Section content — coming soon
      </p>
    </div>
  );
}
