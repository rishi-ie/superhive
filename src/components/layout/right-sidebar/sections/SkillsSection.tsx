import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SettingsSectionProps } from './registry'

interface SkillBadgeListProps {
  title: string
  items: Array<{ path?: string; name?: string; active?: boolean }>
}

function SkillBadgeList({ title, items }: SkillBadgeListProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">None installed</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {item.name ?? item.path?.split('/').pop() ?? 'unknown'}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function SkillsSection({ settings }: SettingsSectionProps) {
  const catalog = settings.catalog

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="rounded-md border border-dashed border-sidebar-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Read-only — extension-managed.
        </p>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="flex flex-col gap-4">
          <SkillBadgeList
            title="Skills"
            items={catalog?.skills ?? []}
          />
          <SkillBadgeList
            title="Extensions"
            items={catalog?.extensions ?? []}
          />
          <SkillBadgeList
            title="Prompts"
            items={catalog?.prompts ?? []}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
