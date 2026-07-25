import { BehaviorSection } from "./BehaviorSection";
import { PermissionsSection } from "./PermissionsSection";
import type { SettingsSectionProps } from "./registry";

export function AdvancedSection(props: SettingsSectionProps) {
  return (
    <details className="group py-1">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Advanced controls</summary>
      <div className="mt-4 flex flex-col gap-5 border-l border-border pl-3">
        <div><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Runtime access</span><PermissionsSection {...props} /></div>
        <div><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Turn behavior</span><BehaviorSection {...props} /></div>
      </div>
    </details>
  );
}
