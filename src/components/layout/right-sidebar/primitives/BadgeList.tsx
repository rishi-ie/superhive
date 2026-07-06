import { Badge } from '@/components/ui/badge';

interface BadgeListProps {
  title: string;
  items: Array<{ path?: string; name?: string }>;
  emptyText?: string;
}

export function BadgeList({ title, items, emptyText = 'None' }: BadgeListProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground/60">{emptyText}</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs opacity-60">
              {item.name ?? item.path?.split('/').pop() ?? 'unknown'}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
