import type { AgentSettingsState } from "@/flows/agents/settings";
import { PermissionIndicator } from "../primitives/PermissionIndicator";
import { BadgeList } from "../primitives/BadgeList";

interface OverviewSectionProps {
  settings: AgentSettingsState;
}

export function OverviewSection({ settings }: OverviewSectionProps) {
  const perms = settings.permissions ?? {
    filesystem: true,
    terminal: true,
    network: true,
  };
  const catalog = settings.catalog;

  return (
    <div className="flex flex-col gap-4 py-2">
      {(settings.name || settings.description) && (
        <div className="flex flex-col gap-0.5">
          {settings.name && (
            <span className="text-sm font-semibold text-foreground">
              {settings.name}
            </span>
          )}
          {settings.description && (
            <span className="text-xs text-muted-foreground">
              {settings.description}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          Active Permissions
        </span>
        <div className="flex items-center gap-3">
          <PermissionIndicator label="Filesystem" enabled={perms.filesystem ?? true} />
          <PermissionIndicator label="Terminal" enabled={perms.terminal ?? true} />
          <PermissionIndicator label="Network" enabled={perms.network ?? true} />
        </div>
      </div>

      <BadgeList
        title="Skills"
        items={catalog?.skills ?? []}
        emptyText="No skills"
      />
      <BadgeList
        title="Extensions"
        items={catalog?.extensions ?? []}
        emptyText="No extensions"
      />
      <BadgeList
        title="Prompts"
        items={catalog?.prompts ?? []}
        emptyText="No prompts"
      />
    </div>
  );
}