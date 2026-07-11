import {
  ChatCircleIcon,
  PencilSimpleIcon,
  PlayIcon,
  WrenchIcon,
  type Icon,
} from "@phosphor-icons/react";
import { Icon as IconWrapper } from "@/components/ui/icon";

export type ActivityType = "message" | "tool" | "run" | "edit";

interface ActivityRowProps {
  type: ActivityType;
  label: string;
  timestamp?: string;
}

const iconMap: Record<ActivityType, Icon> = {
  message: ChatCircleIcon,
  tool: WrenchIcon,
  run: PlayIcon,
  edit: PencilSimpleIcon,
};

export function ActivityRow({ type, label, timestamp }: ActivityRowProps) {
  const IconComp = iconMap[type];
  return (
    <div className="flex items-center gap-list-item py-0.5">
      <IconWrapper icon={IconComp} className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm text-foreground">{label}</span>
      {timestamp && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground/60">
          {timestamp}
        </span>
      )}
    </div>
  );
}
