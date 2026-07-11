import { BadgeList } from '../primitives/BadgeList';
import type { SettingsSectionProps } from './registry';

export function SkillsSection({ settings }: SettingsSectionProps) {
  const catalog = settings.catalog;

  return (
    <div className="flex flex-col gap-gap-loose px-1 py-1">
      <span className="text-xs text-muted-foreground/60">Read-only · extension-managed</span>
      <BadgeList title="Skills" items={catalog?.skills ?? []} />
      <BadgeList title="Extensions" items={catalog?.extensions ?? []} />
      <BadgeList title="Prompts" items={catalog?.prompts ?? []} />
    </div>
  );
}
