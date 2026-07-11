import { Accordion, CatalogRow } from "../primitives";
import type { SettingsSectionProps } from "./registry";

interface CatalogItem {
  path: string;
  active: boolean;
}

function nameOf(item: CatalogItem): string {
  return item.path.split("/").pop() ?? item.path;
}

export function CatalogManageSection({ settings, patch }: SettingsSectionProps) {
  const skills = settings.catalog?.skills ?? [];
  const extensions = settings.catalog?.extensions ?? [];
  const prompts = settings.catalog?.prompts ?? [];

  const toggleItem = (
    key: "skills" | "extensions" | "prompts",
    list: CatalogItem[],
    index: number,
  ) => {
    const next = list.map((item, i) =>
      i === index ? { ...item, active: !item.active } : item,
    );
    patch?.(`catalog.${key}`, next);
  };

  return (
    <div className="flex flex-col">
      <Accordion title="Skills" badge={skills.length} emptyText="No skills" defaultOpen>
        {skills.map((item, i) => (
          <CatalogRow
            key={i}
            name={nameOf(item)}
            active={item.active}
            onToggle={() => toggleItem("skills", skills, i)}
          />
        ))}
      </Accordion>

      <Accordion title="Extensions" badge={extensions.length} emptyText="No extensions">
        {extensions.map((item, i) => (
          <CatalogRow
            key={i}
            name={nameOf(item)}
            active={item.active}
            onToggle={() => toggleItem("extensions", extensions, i)}
          />
        ))}
      </Accordion>

      <Accordion title="Prompts" badge={prompts.length} emptyText="No prompts">
        {prompts.map((item, i) => (
          <CatalogRow
            key={i}
            name={nameOf(item)}
            active={item.active}
            onToggle={() => toggleItem("prompts", prompts, i)}
          />
        ))}
      </Accordion>
    </div>
  );
}
