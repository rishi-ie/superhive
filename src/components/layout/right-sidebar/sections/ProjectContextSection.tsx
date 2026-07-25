import { Textarea } from "@/components/ui/textarea";
import type { SettingsSectionProps } from "./registry";

export function ProjectContextSection({ settings, patch }: SettingsSectionProps) {
  const project = (settings.project ?? {}) as { name?: string; description?: string };
  if (!project.name) return null;

  return (
    <div className="flex flex-col gap-2 py-1">
      <span className="text-sm text-foreground">{project.name}</span>
      <Textarea
        value={project.description ?? ""}
        onChange={(event) => patch?.("project.description", event.target.value)}
        placeholder="What is this project trying to achieve?"
        className="min-h-20 resize-none text-sm"
      />
      <span className="text-[11px] text-muted-foreground">Used as the project agent's standing context on the next message.</span>
    </div>
  );
}
