import { ChevronsUpDown } from 'lucide-react';

type TeamSelectorProps = {
  teamName: string;
  initials: string;
  avatarColor?: string;
};

export function TeamSelector({
  teamName,
  initials,
  avatarColor = 'bg-chart-1',
}: TeamSelectorProps) {
  return (
    <div className="px-2 pt-1 pb-2">
      <button className="no-drag flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-tertiary px-2 py-1.5 text-sm font-medium hover:bg-tertiary-active transition-colors">
        <div
          className={`size-6 shrink-0 rounded-md ${avatarColor} flex items-center justify-center text-[10px] font-bold text-sidebar-primary-foreground`}
        >
          {initials}
        </div>
        <span className="flex-1 text-left text-sidebar-foreground truncate">{teamName}</span>
        <ChevronsUpDown size={12} className="text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}
