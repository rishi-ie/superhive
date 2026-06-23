import { ChevronRight } from 'lucide-react';
import { MaximizeOnDoubleClick } from '@/components/ui/MaximizeOnDoubleClick';

type CenterBreadcrumbProps = {
  segments: string[];
};

export function CenterBreadcrumb({ segments }: CenterBreadcrumbProps) {
  return (
    <MaximizeOnDoubleClick className="flex items-center h-9 border-b border-border px-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              <span className={isLast ? 'text-foreground font-medium' : ''}>
                {segment}
              </span>
              {!isLast && (
                <ChevronRight size={12} className="text-muted-foreground/60" />
              )}
            </span>
          );
        })}
      </div>
    </MaximizeOnDoubleClick>
  );
}
